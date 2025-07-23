from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
from backend.midi import midi_listener
from backend.keyboard import handle_ws_messages
import logging

# Configure logging globally
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s.py: %(message)s',
)

logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI()
clients = {}  # Dictionary to hold client-specific state

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients[websocket] = {"input_mode": "midi", "octave": 4}
    try:
        while True:
            await handle_ws_messages(websocket, clients)
    except WebSocketDisconnect:
        del clients[websocket]

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(midi_listener(clients))
