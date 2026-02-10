"""Claude Agent SDK client wrapper for the habit tracker."""

import os
from pathlib import Path

# Unset API key to force subscription auth
os.environ.pop("ANTHROPIC_API_KEY", None)

from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    create_sdk_mcp_server,
    query,
    AssistantMessage,
    ResultMessage,
    TextBlock,
    ToolUseBlock,
)
from tools import ALL_TOOLS

SYSTEM_PROMPT = """\
You are a supportive habit tracking assistant. You help users build and maintain healthy habits.

Your capabilities:
- Add, list, complete, and delete habits
- Track streaks and provide motivation
- Verify proof photos when users upload them (use the Read tool to view images)
- Generate Gerd Arntz-style progress art reflecting habit streaks

Personality:
- Encouraging but honest -- celebrate wins, gently note missed days
- Very concise responses, 1-2 sentences max. No fluff, no filler.
- Max 1 emoji per response, use sparingly. Most responses need zero emoji.
- Use streak data to motivate: "7 days strong!" or "Let's restart that streak"
- When generating art, briefly note what the symbols represent

When a user uploads a proof photo, examine it and confirm whether it shows evidence of the habit being done. Be reasonable -- a yoga mat photo counts for exercise, a book on a table counts for reading.

IMPORTANT: After verifying and accepting a proof photo, you MUST always generate new progress art using the generate_progress_art tool. This is automatic -- do not ask the user, just do it.
"""


def create_agent_options() -> ClaudeAgentOptions:
    """Create agent options with habit tracker tools."""
    server = create_sdk_mcp_server(
        name="habit-tracker",
        version="1.0.0",
        tools=ALL_TOOLS,
    )

    return ClaudeAgentOptions(
        system_prompt=SYSTEM_PROMPT,
        mcp_servers={"habit-tracker": server},
        allowed_tools=[
            "add_habit",
            "list_habits",
            "complete_habit",
            "delete_habit",
            "get_streak_stats",
            "generate_progress_art",
            "Read",
        ],
        permission_mode="bypassPermissions",
        max_turns=10,
        max_buffer_size=50 * 1024 * 1024,  # 50MB
        cli_path=Path.home() / ".local/bin/claude",
    )


async def run_agent_turn(prompt: str):
    """Run a single agent turn with the given prompt.

    Yields dicts: {"type": "text", "text": str} or {"type": "tool_use", "name": str, "input": dict}
    and finally {"type": "result", "cost": float}.
    """
    options = create_agent_options()

    async for message in query(
        prompt=prompt,
        options=options,
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    yield {"type": "text", "text": block.text}
                elif isinstance(block, ToolUseBlock):
                    yield {"type": "tool_use", "name": block.name, "input": block.input}
        elif isinstance(message, ResultMessage):
            yield {"type": "result", "cost": getattr(message, "total_cost_usd", 0)}


class AgentSession:
    """Stateful agent session using ClaudeSDKClient for multi-turn chat."""

    def __init__(self):
        self.client: ClaudeSDKClient | None = None
        self.options = create_agent_options()

    async def start(self):
        self.client = ClaudeSDKClient(options=self.options)
        await self.client.__aenter__()
        await self.client.connect()

    async def send(self, message: str):
        """Send a message and yield response chunks."""
        if not self.client:
            await self.start()

        await self.client.query(message)

        async for msg in self.client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        yield {"type": "text", "text": block.text}
                    elif isinstance(block, ToolUseBlock):
                        yield {"type": "tool_use", "name": block.name, "input": block.input}
            elif isinstance(msg, ResultMessage):
                yield {"type": "result", "cost": getattr(msg, "total_cost_usd", 0)}

    async def close(self):
        if self.client:
            await self.client.__aexit__(None, None, None)
            self.client = None
