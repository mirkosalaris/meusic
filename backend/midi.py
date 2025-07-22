import mido
import asyncio

# MIDI input listener: reads from device and sends to all clients in MIDI mode
async def midi_listener(clients):
    try:
        with mido.open_input() as inport:
            for msg in inport:
                if msg.type == 'note_on':
                    for ws, client in list(clients.items()):
                        if client["input_mode"] == "midi":
                            try:
                                await ws.send_json({
                                    "type": "note_on",
                                    "note": msg.note,
                                    "velocity": msg.velocity,
                                    "source": "midi"
                                })
                            except:
                                continue
    except Exception as e:
        print("MIDI Error:", e)
