"""JSON-backed habit storage with streak calculation."""

import json
import uuid
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Optional

DATA_FILE = Path(__file__).parent / "habits.json"


def _today() -> str:
    return date.today().isoformat()


def _load() -> list[dict]:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text())
    return []


def _save(habits: list[dict]):
    DATA_FILE.write_text(json.dumps(habits, indent=2, default=str))


def _is_due_today(habit: dict) -> bool:
    """Check if a habit is scheduled for today based on regularity."""
    today = date.today()
    weekday = today.weekday()  # 0=Monday..6=Sunday
    reg = habit["regularity"]

    if reg == "daily":
        return True
    if reg == "weekdays":
        return weekday < 5
    if reg == "weekly":
        # Due on the same weekday as creation
        created = date.fromisoformat(habit["created_at"][:10])
        return weekday == created.weekday()
    if reg == "3x_week":
        # Mon, Wed, Fri
        return weekday in (0, 2, 4)
    if reg == "custom":
        return weekday in (habit.get("custom_days") or [])
    return False


def _due_dates(habit: dict, start: date, end: date) -> set[str]:
    """Generate all dates a habit was due between start and end (inclusive)."""
    dates = set()
    current = start
    while current <= end:
        weekday = current.weekday()
        reg = habit["regularity"]
        due = False
        if reg == "daily":
            due = True
        elif reg == "weekdays":
            due = weekday < 5
        elif reg == "weekly":
            created = date.fromisoformat(habit["created_at"][:10])
            due = weekday == created.weekday()
        elif reg == "3x_week":
            due = weekday in (0, 2, 4)
        elif reg == "custom":
            due = weekday in (habit.get("custom_days") or [])
        if due:
            dates.add(current.isoformat())
        current += timedelta(days=1)
    return dates


def calculate_streak(habit: dict) -> int:
    """Calculate current consecutive streak.

    Walks backwards from today through due dates.
    A streak breaks when a due date has no completion.
    Today being incomplete doesn't break the streak (day isn't over yet).
    """
    completions = {c["date"] for c in habit.get("completions", [])}
    today = date.today()
    created = date.fromisoformat(habit["created_at"][:10])
    streak = 0
    current = today

    # If today is due and completed, count it
    if current.isoformat() in completions and _is_due_today(habit):
        streak += 1
    # Move to yesterday
    current -= timedelta(days=1)

    while current >= created:
        # Check if this date was a due date
        weekday = current.weekday()
        reg = habit["regularity"]
        was_due = False
        if reg == "daily":
            was_due = True
        elif reg == "weekdays":
            was_due = weekday < 5
        elif reg == "weekly":
            was_due = weekday == created.weekday()
        elif reg == "3x_week":
            was_due = weekday in (0, 2, 4)
        elif reg == "custom":
            was_due = weekday in (habit.get("custom_days") or [])

        if was_due:
            if current.isoformat() in completions:
                streak += 1
            else:
                break  # Streak broken
        current -= timedelta(days=1)

    return streak


class HabitStore:
    """CRUD operations for habits with automatic streak calculation."""

    def list_habits(self) -> list[dict]:
        habits = _load()
        for h in habits:
            h["streak"] = calculate_streak(h)
            h["best_streak"] = max(h.get("best_streak", 0), h["streak"])
            h["due_today"] = _is_due_today(h)
            h["done_today"] = _today() in {c["date"] for c in h.get("completions", [])}
        return habits

    def get_habit(self, habit_id: str) -> Optional[dict]:
        for h in self.list_habits():
            if h["id"] == habit_id:
                return h
        return None

    def add_habit(
        self,
        name: str,
        regularity: str = "daily",
        duration_minutes: int = 15,
        description: str = "",
        custom_days: Optional[list[int]] = None,
    ) -> dict:
        habits = _load()
        habit = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "regularity": regularity,
            "custom_days": custom_days,
            "duration_minutes": duration_minutes,
            "streak": 0,
            "best_streak": 0,
            "completions": [],
            "created_at": datetime.now().isoformat(),
        }
        habits.append(habit)
        _save(habits)
        return habit

    def complete_habit(
        self,
        habit_id: str,
        proof_image: Optional[str] = None,
        verified: bool = False,
        duration_actual: Optional[int] = None,
    ) -> Optional[dict]:
        habits = _load()
        for h in habits:
            if h["id"] == habit_id:
                today = _today()
                # Remove existing completion for today if any
                h["completions"] = [c for c in h["completions"] if c["date"] != today]
                h["completions"].append(
                    {
                        "date": today,
                        "proof_image": proof_image,
                        "verified": verified,
                        "duration_actual": duration_actual,
                    }
                )
                # Update best streak
                streak = calculate_streak(h)
                h["best_streak"] = max(h.get("best_streak", 0), streak)
                _save(habits)
                h["streak"] = streak
                h["due_today"] = _is_due_today(h)
                h["done_today"] = True
                return h
        return None

    def update_habit(self, habit_id: str, **fields) -> Optional[dict]:
        habits = _load()
        for h in habits:
            if h["id"] == habit_id:
                for key in ("name", "description", "regularity", "duration_minutes", "custom_days"):
                    if key in fields and fields[key] is not None:
                        h[key] = fields[key]
                _save(habits)
                h["streak"] = calculate_streak(h)
                h["best_streak"] = max(h.get("best_streak", 0), h["streak"])
                h["due_today"] = _is_due_today(h)
                h["done_today"] = _today() in {c["date"] for c in h.get("completions", [])}
                return h
        return None

    def uncomplete_habit(self, habit_id: str) -> Optional[dict]:
        """Remove today's completion for a habit (undo)."""
        habits = _load()
        for h in habits:
            if h["id"] == habit_id:
                today = _today()
                h["completions"] = [c for c in h["completions"] if c["date"] != today]
                _save(habits)
                h["streak"] = calculate_streak(h)
                h["best_streak"] = max(h.get("best_streak", 0), h["streak"])
                h["due_today"] = _is_due_today(h)
                h["done_today"] = False
                return h
        return None

    def delete_habit(self, habit_id: str) -> bool:
        habits = _load()
        before = len(habits)
        habits = [h for h in habits if h["id"] != habit_id]
        if len(habits) < before:
            _save(habits)
            return True
        return False

    def get_stats(self) -> dict:
        habits = self.list_habits()
        total = len(habits)
        on_streak = sum(1 for h in habits if h["streak"] > 0)
        due_today = sum(1 for h in habits if h["due_today"])
        done_today = sum(1 for h in habits if h["done_today"])
        return {
            "total_habits": total,
            "on_streak": on_streak,
            "due_today": due_today,
            "done_today": done_today,
            "completion_rate": (done_today / due_today * 100) if due_today > 0 else 0,
            "needs_attention": due_today - done_today,
        }
