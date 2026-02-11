"""JSON-backed settings store with defaults merge for forward compatibility."""

import json
from pathlib import Path

SETTINGS_FILE = Path(__file__).parent / "settings.json"

ART_PRESETS = {
    "arntz": (
        "Gerd Arntz isotype style illustration on aged paper texture. "
        "Muted earthy colors: terracotta, olive green, dark navy, warm ochre. "
        "Bold geometric shapes, clean flat design, no text, no letters, no words. "
        "Simplified pictographic figures. Vintage infographic aesthetic. "
        "Linocut print texture."
    ),
    "bauhaus": (
        "Bauhaus design style illustration. Primary colors: red, blue, yellow on white background. "
        "Geometric shapes: circles, triangles, squares. Kandinsky-inspired abstract composition. "
        "Clean lines, no text, no letters, no words. Flat bold shapes, constructive art aesthetic."
    ),
    "constructivist": (
        "Soviet Constructivist propaganda poster style illustration. "
        "Red, black, and white color palette. Diagonal composition, bold angular shapes. "
        "Typography-inspired geometric forms (no actual text/letters/words). "
        "Revolutionary avant-garde aesthetic, Rodchenko and El Lissitzky inspired."
    ),
    "art_deco": (
        "Art Deco style illustration. Gold, black, and cream color palette. "
        "Fan motifs, geometric symmetry, sunburst patterns. Gatsby-era elegance. "
        "Luxurious metallic textures, clean ornamental geometry. "
        "No text, no letters, no words. 1920s decorative arts aesthetic."
    ),
    "pop_art": (
        "Pop Art style illustration. Ben-Day dots, bright flat colors. "
        "Lichtenstein and Warhol inspired. Comic book style bold outlines. "
        "Saturated primary colors, halftone dot patterns. "
        "No text, no letters, no words, no speech bubbles. High contrast graphic art."
    ),
    "swiss": (
        "Swiss International Typographic Style illustration. "
        "Black, white, and one accent color. Helvetica-grid aesthetic. "
        "Clean mathematical composition, asymmetric layouts, geometric precision. "
        "No text, no letters, no words. Minimal, functional, objective graphic design."
    ),
}

DEFAULTS = {
    "image_prompt": ART_PRESETS["arntz"],
    "personal_prompt": "",
    "proof_strictness": "normal",
    "data_path": "habits.json",
    "art_model": "gemini-2.5-flash-image",
    "streak_reset": "strict",
    "art_preset": "arntz",
    "include_proof_images": False,
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


def get_art_prompt() -> str:
    """Return the active art style prompt -- preset or custom override."""
    preset = get_setting("art_preset")
    if preset in ART_PRESETS:
        return ART_PRESETS[preset]
    # "custom" or unknown key -- fall back to the freeform image_prompt
    return get_setting("image_prompt")
