# Mapping from keys to semitone offset
KEY_NOTE_MAP = {
    "a": 0, "w": 1, "s": 2, "e": 3, "d": 4, "f": 5,
    "t": 6, "g": 7, "y": 8, "h": 9, "u": 10, "j": 11
}

# Convert a key press to MIDI note, adjusting octave
def convert_key_to_note(key, client):
    if key == "z":
        client["octave"] = max(0, client["octave"] - 1)
        return None
    elif key == "m":
        client["octave"] = min(8, client["octave"] + 1)
        return None
    elif key in KEY_NOTE_MAP:
        return client["octave"] * 12 + KEY_NOTE_MAP[key]
    return None
