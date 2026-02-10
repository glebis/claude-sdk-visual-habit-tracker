"""JSON-backed settings store with defaults merge for forward compatibility."""

import json
from pathlib import Path

SETTINGS_FILE = Path(__file__).parent / "settings.json"

DEFAULTS = {
    "image_prompt": (
        "Gerd Arntz isotype style illustration on aged paper texture. "
        "Muted earthy colors: terracotta, olive green, dark navy, warm ochre. "
        "Bold geometric shapes, clean flat design, no text, no letters, no words. "
        "Simplified pictographic figures. Vintage infographic aesthetic. "
        "Linocut print texture."
    ),
    "personal_prompt": "",
    "proof_strictness": "normal",
    "data_path": "habits.json",
    "art_model": "gemini-2.5-flash-image",
    "streak_reset": "strict",
}


def load_settings() -> dict:
    """Load settings, merging stored values over defaults."""
    settings = dict(DEFAULTS)
    if SETTINGS_FILE.exists():
        try:
            stored = json.loads(SETTINGS_FILE.read_text())
            settings.update(stored)
        except (json.JSONDecodeError, OSError):
            pass
    return settings


def save_settings(settings: dict):
    """Write full settings dict to disk."""
    SETTINGS_FILE.write_text(json.dumps(settings, indent=2))


def update_settings(updates: dict) -> dict:
    """Merge partial updates into current settings and persist."""
    settings = load_settings()
    # Only accept known keys
    for key in updates:
        if key in DEFAULTS:
            settings[key] = updates[key]
    save_settings(settings)
    return settings


def get_setting(key: str):
    """Get a single setting value."""
    return load_settings().get(key, DEFAULTS.get(key))
