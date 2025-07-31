from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from backend.midi import midi_listener
from backend.keyboard import handle_ws_messages
import logging

from fastapi.responses import JSONResponse
from fastapi import HTTPException
import os
import json

SCORE_DIR = "./shared"
EXTENSION = ".score.json"

# Configure logging globally
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s.py: %(message)s',
)

logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = {}  # Dictionary to hold client-specific state

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients[websocket] = {"input_mode": "keyboard", "octave": 4}
    try:
        while True:
            await handle_ws_messages(websocket, clients)
    except WebSocketDisconnect:
        del clients[websocket]

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(midi_listener(clients))

@app.get("/scores")
async def list_scores():
    scores = []
    for filename in os.listdir(SCORE_DIR):
        if filename.endswith(EXTENSION):
            path = os.path.join(SCORE_DIR, filename)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    scores.append({
                        "id": filename,
                        "title": data.get("title", filename)
                    })
            except Exception as e:
                logger.warning(f"Error reading {filename}: {e}")
    return JSONResponse(scores)

@app.get("/scores/{score_id}")
async def get_score(score_id: str):
    if ".." in score_id or "/" in score_id:
        raise HTTPException(status_code=400, detail="Invalid score ID")
    path = os.path.join(SCORE_DIR, score_id)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Score not found")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)