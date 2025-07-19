from fastapi import FastAPI, WebSocket
import asyncio
from backend.midi import midi_listener

app = FastAPI()
clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await asyncio.sleep(1)
    except:
        clients.remove(websocket)

# Background MIDI task
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(midi_listener(clients))
