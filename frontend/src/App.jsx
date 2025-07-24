import React, { useEffect, useState, useRef } from 'react';
import InputModeSwitcher from "./components/InputModeSwitcher";
import ScoreRenderer from './components/ScoreRenderer';

// Utility functions to interpret MIDI messages
function isNoteOn(data) {
  return data.type === "note_on" && data.velocity !== 0;
}

function isNoteOff(data) {
  return data.type === "note_on" && data.velocity === 0;
}

function App() {
  const [dotVisible, setDotVisible] = useState(false);
  const [inputMode, setInputMode] = useState("midi");
  const [socket, setSocket] = useState(null);
  const scoreRef = useRef(null);

  // Handle incoming messages (MIDI or keyboard events from backend)
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Note received:", data);

      if (isNoteOn(data)) {
        setDotVisible(true);
      } else if (isNoteOff(data)) {
        setDotVisible(false);
      }
      
      if (scoreRef.current) {
        scoreRef.current.handleMIDIMessage(data);
      }
    };

    return () => ws.close();
  }, []);

  // Send keypress events to backend when in 'keyboard' mode
  useEffect(() => {
    const allowedKeys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "z", "m"];

    const handleKeyDown = (event) => {
      console.log("Key down event:", event);
      if (inputMode === "keyboard" && socket?.readyState === WebSocket.OPEN) {
        const key = event.key.toLowerCase();
        if (allowedKeys.includes(key)) {
          socket.send(JSON.stringify({
            type: "key_down",
            key: key,
          }));
        }
      }
    };

    const handleKeyUp = (event) => {
      console.log("Key up event:", event);
      if (inputMode === "keyboard" && socket?.readyState === WebSocket.OPEN) {
        const key = event.key.toLowerCase();
        if (allowedKeys.includes(key)) {
          socket.send(JSON.stringify({
            type: "key_up",
            key: key,
          }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [inputMode]);

  return (
    <div className="text-center mt-24">
      <h1 className="text-3xl font-bold mb-6">MIDI Listener</h1>
      <ScoreRenderer ref={scoreRef} />
      {dotVisible && (
        <div className="w-12 h-12 bg-green-500 rounded-full mx-auto" />
      )}
      <InputModeSwitcher
        socket={socket}
        inputMode={inputMode}
        onModeChange={setInputMode}
      />
    </div>
  );
}

export default App;
