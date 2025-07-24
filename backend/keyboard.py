import json
import logging

# Constants
DEFAULT_KEYBOARD_VELOCITY = 127  # Standard velocity for key presses
KEYBOARD_OFF_VELOCITY = 0  # Velocity for key releases
logger = logging.getLogger(__name__)

# Mapping from keys to semitone offset
KEY_NOTE_MAP = {
    "a": 0, "w": 1, "s": 2, "e": 3, "d": 4, "f": 5,
    "t": 6, "g": 7, "y": 8, "h": 9, "u": 10, "j": 11
}

# Convert a key press to MIDI note, adjusting octave
def convert_key_to_note(key, client):
    if key in KEY_NOTE_MAP:
        return client["octave"] * 12 + KEY_NOTE_MAP[key]
    return None

def changeOctave(key, client):
    if key == "z":
        client["octave"] = max(0, client["octave"] - 1)
    elif key == "m":
        client["octave"] = min(8, client["octave"] + 1)
    logger.info(f"Changed octave to {client['octave']} for client {client}")

# Handles WebSocket messages from frontend: keyboard presses and mode switches
async def handle_ws_messages(websocket, clients):
    msg = await websocket.receive_text()
    data = json.loads(msg)
    logger.info(f"Data received from WebSocket: {data}")

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

    elif data["type"] == "key_press" and clients[websocket]["input_mode"] == "keyboard":
        key = data["key"]
        changeOctave(key, clients[websocket])