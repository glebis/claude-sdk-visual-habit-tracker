"""FastAPI server: REST API for habits, WebSocket for agent chat, static image serving."""

import json
import os
import shutil
import uuid
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from habit_store import HabitStore
from agent import AgentSession
from image_generator import IMAGES_DIR

app = FastAPI(title="Habit Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = HabitStore()

UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


# --- REST endpoints ---


@app.get("/api/habits")
def list_habits():
    return store.list_habits()


@app.post("/api/habits")
def add_habit(body: dict):
    return store.add_habit(
        name=body["name"],
        regularity=body.get("regularity", "daily"),
        duration_minutes=body.get("duration_minutes", 15),
        description=body.get("description", ""),
        custom_days=body.get("custom_days"),
    )


@app.post("/api/habits/{habit_id}/complete")
def complete_habit(habit_id: str, body: dict = {}):
    result = store.complete_habit(
        habit_id=habit_id,
        proof_image=body.get("proof_image"),
        duration_actual=body.get("duration_actual"),
    )
    if result is None:
        return {"error": "Habit not found"}, 404
    return result


@app.post("/api/habits/{habit_id}/uncomplete")
def uncomplete_habit(habit_id: str):
    result = store.uncomplete_habit(habit_id)
    if result is None:
        return {"error": "Habit not found"}, 404
    return result


@app.patch("/api/habits/{habit_id}")
def update_habit(habit_id: str, body: dict):
    result = store.update_habit(habit_id, **body)
    if result is None:
        return {"error": "Habit not found"}, 404
    return result


@app.delete("/api/habits/{habit_id}")
def delete_habit(habit_id: str):
    ok = store.delete_habit(habit_id)
    return {"deleted": ok}


@app.get("/api/stats")
def get_stats():
    return store.get_stats()


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = Path(file.filename or "photo.jpg").suffix
    name = f"{uuid.uuid4().hex[:8]}{ext}"
    path = UPLOADS_DIR / name
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": name, "path": str(path)}


@app.get("/api/images")
def list_images():
    images = sorted(IMAGES_DIR.glob("progress_*.png"), key=lambda p: p.stat().st_mtime)
    return [p.name for p in images]


@app.get("/api/images/{image_name}")
def get_image(image_name: str):
    path = IMAGES_DIR / image_name
    if not path.exists():
        return {"error": "Not found"}, 404
    return FileResponse(path, media_type="image/png")


@app.get("/api/uploads/{filename}")
def get_upload(filename: str):
    path = UPLOADS_DIR / filename
    if not path.exists():
        return {"error": "Not found"}, 404
    return FileResponse(path)


# --- WebSocket for agent chat ---


@app.websocket("/ws/chat")
async def chat_ws(ws: WebSocket):
    await ws.accept()
    session = AgentSession()

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            user_text = msg.get("message", "")

            try:
                # Snapshot image dir before agent turn
                images_before = set(IMAGES_DIR.glob("progress_*.png"))

                async for chunk in session.send(user_text):
                    await ws.send_text(json.dumps(chunk))

                # Check for new images after agent turn
                images_after = set(IMAGES_DIR.glob("progress_*.png"))
                new_images = images_after - images_before
                for img in new_images:
                    await ws.send_text(json.dumps({
                        "type": "image",
                        "name": img.name,
                    }))
            except Exception as e:
                await ws.send_text(json.dumps({"type": "error", "text": str(e)}))

    except WebSocketDisconnect:
        await session.close()
    except Exception:
        await session.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
