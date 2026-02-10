"""Nano Banana (google-genai) image generation for Gerd Arntz-style isotype art."""

import base64
import os
import uuid
from pathlib import Path

from google import genai
from google.genai import types

from settings_store import get_setting

IMAGES_DIR = Path(__file__).parent / "generated_images"
IMAGES_DIR.mkdir(exist_ok=True)


def _get_client() -> genai.Client:
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Set GOOGLE_API_KEY or GEMINI_API_KEY env var")
    return genai.Client(api_key=api_key)


def generate_progress_art(habits_summary: str) -> dict:
    """Generate Arntz-style art based on habit stats.

    Uses Gemini Flash Image (generate_content with IMAGE modality).
    Requires a billed Google AI Studio account.

    Returns {"image_path": str, "image_name": str} on success.
    """
    style_prompt = get_setting("image_prompt")
    prompt = (
        f"{style_prompt}\n\n"
        f"Generate an image: an isotype chart representing personal habit progress:\n"
        f"{habits_summary}\n\n"
        f"Use filled geometric figures for completed/active streaks, "
        f"empty outlines for incomplete, arrows showing progress direction. "
        f"Pictographic human figures in rows."
    )

    client = _get_client()
    response = client.models.generate_content(
        model=get_setting("art_model"),
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
        ),
    )

    # Extract image from response parts
    image_data = None
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.data:
            image_data = part.inline_data.data
            break

    if not image_data:
        raise RuntimeError("No image generated -- is billing enabled on your Google AI Studio account?")

    image_name = f"progress_{uuid.uuid4().hex[:8]}.png"
    image_path = IMAGES_DIR / image_name
    image_path.write_bytes(image_data)

    return {"image_path": str(image_path), "image_name": image_name}


def get_image_base64(image_name: str) -> str | None:
    """Return base64-encoded image data for a generated image."""
    path = IMAGES_DIR / image_name
    if path.exists():
        return base64.b64encode(path.read_bytes()).decode()
    return None
