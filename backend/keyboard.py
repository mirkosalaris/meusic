import json
from backend.state import convert_key_to_note

# Constants
DEFAULT_KEYBOARD_VELOCITY = 127  # Standard velocity for key presses
KEYBOARD_OFF_VELOCITY = 0  # Velocity for key releases

# Handles WebSocket messages from frontend: keyboard presses and mode switches
async def handle_ws_messages(websocket, clients):
    msg = await websocket.receive_text()
    data = json.loads(msg)

    if data["type"] == "mode_switch":
        clients[websocket]["input_mode"] = data["input"]

    elif data["type"] == "key_down" and clients[websocket]["input_mode"] == "keyboard":
        key = data["key"]
        note = convert_key_to_note(key, clients[websocket])
        if note is not None:
            await websocket.send_json({
                "type": "note_on",
                "note": note,
                "velocity": DEFAULT_KEYBOARD_VELOCITY,
                "source": "keyboard"
            })

    elif data["type"] == "key_up" and clients[websocket]["input_mode"] == "keyboard":
        key = data["key"]
        note = convert_key_to_note(key, clients[websocket])
        if note is not None:
            await websocket.send_json({
                "type": "note_on", # Note off event with the convention of note_on with velocity 0
                "note": note,
                "velocity": KEYBOARD_OFF_VELOCITY,
                "source": "keyboard"
            })