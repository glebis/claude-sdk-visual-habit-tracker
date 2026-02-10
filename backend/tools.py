"""MCP tools for the habit tracker agent."""

import json
from claude_agent_sdk import tool
from habit_store import HabitStore
from image_generator import generate_progress_art

store = HabitStore()


@tool(
    "add_habit",
    "Create a new habit to track. Regularity options: daily, weekly, 3x_week, weekdays, custom.",
    {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Name of the habit"},
            "regularity": {
                "type": "string",
                "enum": ["daily", "weekly", "3x_week", "weekdays", "custom"],
                "description": "How often the habit should be done",
            },
            "duration_minutes": {
                "type": "integer",
                "description": "Target session length in minutes",
            },
            "description": {
                "type": "string",
                "description": "Optional description of the habit",
            },
            "custom_days": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "For custom regularity: days of week (0=Mon..6=Sun)",
            },
        },
        "required": ["name"],
    },
)
async def add_habit(args):
    habit = store.add_habit(
        name=args["name"],
        regularity=args.get("regularity", "daily"),
        duration_minutes=args.get("duration_minutes", 15),
        description=args.get("description", ""),
        custom_days=args.get("custom_days"),
    )
    return {
        "content": [
            {"type": "text", "text": f"Created habit '{habit['name']}' (ID: {habit['id']})"}
        ]
    }


@tool(
    "list_habits",
    "List all tracked habits with their current streaks and status.",
    {"type": "object", "properties": {}},
)
async def list_habits(args):
    habits = store.list_habits()
    if not habits:
        return {"content": [{"type": "text", "text": "No habits tracked yet."}]}

    lines = []
    for h in habits:
        status = "done" if h["done_today"] else ("due" if h["due_today"] else "not due")
        lines.append(
            f"- {h['name']} | streak: {h['streak']} (best: {h['best_streak']}) | "
            f"{h['regularity']} | {h['duration_minutes']}min | today: {status} | id: {h['id']}"
        )
    return {"content": [{"type": "text", "text": "\n".join(lines)}]}


@tool(
    "complete_habit",
    "Mark a habit as completed for today. Optionally include a proof image path.",
    {
        "type": "object",
        "properties": {
            "habit_id": {"type": "string", "description": "The habit's UUID"},
            "proof_image": {
                "type": "string",
                "description": "Path to proof photo if uploaded",
            },
            "duration_actual": {
                "type": "integer",
                "description": "Actual minutes spent",
            },
        },
        "required": ["habit_id"],
    },
)
async def complete_habit(args):
    result = store.complete_habit(
        habit_id=args["habit_id"],
        proof_image=args.get("proof_image"),
        duration_actual=args.get("duration_actual"),
    )
    if result is None:
        return {"content": [{"type": "text", "text": "Habit not found."}], "is_error": True}
    return {
        "content": [
            {
                "type": "text",
                "text": (
                    f"Marked '{result['name']}' as done! "
                    f"Current streak: {result['streak']} days."
                ),
            }
        ]
    }


@tool(
    "delete_habit",
    "Delete a habit by its ID.",
    {
        "type": "object",
        "properties": {
            "habit_id": {"type": "string", "description": "The habit's UUID"},
        },
        "required": ["habit_id"],
    },
)
async def delete_habit(args):
    ok = store.delete_habit(args["habit_id"])
    if not ok:
        return {"content": [{"type": "text", "text": "Habit not found."}], "is_error": True}
    return {"content": [{"type": "text", "text": "Habit deleted."}]}


@tool(
    "get_streak_stats",
    "Get overall habit tracking statistics: completion rate, streaks, etc.",
    {"type": "object", "properties": {}},
)
async def get_streak_stats(args):
    stats = store.get_stats()
    text = (
        f"Total habits: {stats['total_habits']}\n"
        f"On streak: {stats['on_streak']}\n"
        f"Due today: {stats['due_today']}\n"
        f"Done today: {stats['done_today']}\n"
        f"Completion rate: {stats['completion_rate']:.0f}%\n"
        f"Needs attention: {stats['needs_attention']}"
    )
    return {"content": [{"type": "text", "text": text}]}


@tool(
    "generate_progress_art",
    "Generate Gerd Arntz-style isotype art reflecting current habit progress. Uses Nano Banana (Imagen).",
    {"type": "object", "properties": {}},
)
async def generate_progress_art_tool(args):
    stats = store.get_stats()
    habits = store.list_habits()

    summary_lines = [f"Overall: {stats['done_today']}/{stats['due_today']} done today, {stats['on_streak']} habits on streak"]
    for h in habits:
        status = "active streak" if h["streak"] > 0 else "no streak"
        summary_lines.append(f"{h['name']}: streak {h['streak']}, {status}")

    try:
        result = generate_progress_art("\n".join(summary_lines))
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Generated progress art: {result['image_name']}",
                }
            ]
        }
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Art generation failed: {e}"}], "is_error": True}


@tool(
    "uncomplete_habit",
    "Undo today's completion for a habit. Use when proof verification fails or a completion needs to be rolled back.",
    {
        "type": "object",
        "properties": {
            "habit_id": {"type": "string", "description": "The habit's UUID"},
        },
        "required": ["habit_id"],
    },
)
async def uncomplete_habit(args):
    result = store.uncomplete_habit(args["habit_id"])
    if result is None:
        return {"content": [{"type": "text", "text": "Habit not found."}], "is_error": True}
    return {
        "content": [
            {
                "type": "text",
                "text": f"Unmarked '{result['name']}' -- no longer done for today.",
            }
        ]
    }


ALL_TOOLS = [
    add_habit,
    list_habits,
    complete_habit,
    delete_habit,
    uncomplete_habit,
    get_streak_stats,
    generate_progress_art_tool,
]
