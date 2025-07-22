import mido
import asyncio
import threading

def midi_worker(clients, loop):
    try:
        with mido.open_input() as inport:
            for msg in inport:
                print("MIDI message received:", msg)
                if msg.type == 'note_on':
                    # Submit coroutine to the main event loop
                    asyncio.run_coroutine_threadsafe(
                        broadcast_midi_message(clients, msg),
                        loop
                    )
    except Exception as e:
        print("MIDI Error:", e)

async def broadcast_midi_message(clients, msg):
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

# MIDI input listener: reads from device and sends to all clients in MIDI mode
async def midi_listener(clients):
    loop = asyncio.get_running_loop()
    thread = threading.Thread(target=midi_worker, args=(clients, loop), daemon=True)
    thread.start()
