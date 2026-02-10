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
from settings_store import get_setting

BASE_SYSTEM_PROMPT = """\
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

IMPORTANT: After verifying and accepting a proof photo, you MUST always generate new progress art using the generate_progress_art tool. This is automatic -- do not ask the user, just do it.
"""

STRICTNESS_INSTRUCTIONS = {
    "off": (
        "\nProof verification: DISABLED. When a user uploads a proof photo, "
        "immediately mark the habit complete without examining the image. "
        "Then generate progress art."
    ),
    "lenient": (
        "\nProof verification flow:\n"
        "When a user uploads a proof photo, give them the benefit of the doubt. "
        "Accept any photo that could plausibly relate to the habit. "
        "Only reject obviously unrelated images (e.g. a cat photo for 'go running').\n"
        "- If accepted: call complete_habit with the habit_id and proof_image, then generate progress art.\n"
        "- If rejected: explain briefly and ask to try again."
    ),
    "normal": (
        "\nProof verification flow:\n"
        "When a user uploads a proof photo, examine it and confirm whether it shows "
        "evidence of the habit being done. Be reasonable -- a yoga mat photo counts for "
        "exercise, a book on a table counts for reading.\n"
        "- If the proof looks legit: call complete_habit with the habit_id and proof_image, "
        "then generate progress art. Do NOT ask the user before completing -- just do it.\n"
        "- If the proof is unrelated or unclear: do NOT call complete_habit. Explain why "
        "the photo doesn't match and ask the user to try again.\n"
        "- If a habit was completed by mistake, use uncomplete_habit to roll it back."
    ),
    "strict": (
        "\nProof verification flow:\n"
        "When a user uploads a proof photo, examine it carefully. The photo must clearly "
        "and directly show the habit activity being performed or its immediate result. "
        "Indirect evidence is not enough -- a yoga mat alone doesn't count for exercise "
        "(you need to see someone on it), a closed book doesn't count for reading.\n"
        "- If the proof clearly shows the activity: call complete_habit, then generate progress art.\n"
        "- Otherwise: do NOT call complete_habit. Explain specifically what you'd need to see."
    ),
}


def _build_system_prompt() -> str:
    """Build full system prompt from base + strictness + personal prompt."""
    strictness = get_setting("proof_strictness")
    parts = [BASE_SYSTEM_PROMPT]
    parts.append(STRICTNESS_INSTRUCTIONS.get(strictness, STRICTNESS_INSTRUCTIONS["normal"]))

    personal = get_setting("personal_prompt")
    if personal and personal.strip():
        parts.append(f"\nAdditional instructions from user:\n{personal.strip()}")

    return "\n".join(parts)


def create_agent_options() -> ClaudeAgentOptions:
    """Create agent options with habit tracker tools."""
    server = create_sdk_mcp_server(
        name="habit-tracker",
        version="1.0.0",
        tools=ALL_TOOLS,
    )

    return ClaudeAgentOptions(
        system_prompt=_build_system_prompt(),
        mcp_servers={"habit-tracker": server},
        allowed_tools=[
            "add_habit",
            "list_habits",
            "complete_habit",
            "uncomplete_habit",
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
