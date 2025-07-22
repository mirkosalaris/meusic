import json
from backend.state import convert_key_to_note

# Constants
DEFAULT_KEYBOARD_VELOCITY = 127  # Standard velocity for key presses

# Handles WebSocket messages from frontend: keyboard presses and mode switches
async def handle_ws_messages(websocket, clients):
    msg = await websocket.receive_text()
    data = json.loads(msg)

    if data["type"] == "mode_switch":
        clients[websocket]["input_mode"] = data["input"]

    elif data["type"] == "key_press" and clients[websocket]["input_mode"] == "keyboard":
        key = data["key"]
        note = convert_key_to_note(key, clients[websocket])
        if note is not None:
            await websocket.send_json({
                "type": "note_on",
                "note": note,
                "velocity": DEFAULT_KEYBOARD_VELOCITY,
                "source": "keyboard"
            })
