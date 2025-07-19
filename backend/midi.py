import mido
import asyncio

async def midi_listener(clients):
    try:
        with mido.open_input() as inport:
            for msg in inport:
                if msg.type == 'note_on':
                    for ws in clients:
                        await ws.send_json({"note": msg.note, "velocity": msg.velocity})
    except Exception as e:
        print("MIDI Error:", e)
