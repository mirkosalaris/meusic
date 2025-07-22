
import React, { useEffect, useState, useRef } from 'react';
import InputModeSwitcher from "./components/InputModeSwitcher";

function App() {
  const [dotVisible, setDotVisible] = useState(false);
  const [inputMode, setInputMode] = useState("midi");
  const wsRef = useRef(null);

  // Handle incoming messages (MIDI or keyboard events from backend)
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "note_on") {
        console.log("Note received:", data);
        setDotVisible(true);
        setTimeout(() => setDotVisible(false), 200);
      }
    };

    return () => ws.close();
  }, []);

  // Send keypress events to backend when in 'keyboard' mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (inputMode === "keyboard" && wsRef.current?.readyState === WebSocket.OPEN) {
        const key = event.key.toLowerCase();
        const allowedKeys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "z", "m"];
        if (allowedKeys.includes(key)) {
          wsRef.current.send(JSON.stringify({
            type: "key_press",
            key: key,
          }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputMode]);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>MIDI Listener</h1>
      {dotVisible && (
        <div style={{
          width: '50px', height: '50px',
          backgroundColor: 'green', borderRadius: '50%',
          margin: 'auto'
        }} />
      )}
      <InputModeSwitcher
        socket={wsRef.current}
        inputMode={inputMode}
        onModeChange={setInputMode}
      />
    </div>
  );
}

export default App;
