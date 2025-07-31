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
  // WebSocket connection to the backend
  const [socket, setSocket] = useState(null);

  // a green dot that appears when a note is played. Used for debug purposes
  const [dotVisible, setDotVisible] = useState(false);

  // input mode can be 'keyboard' (the computer's one) or 'midi'
  const [inputMode, setInputMode] = useState("keyboard");

  // reference to the ScoreRenderer component
  const scoreRef = useRef(null);

  // list of available scores loaded from the backend
  const [scores, setScores] = useState([]); 
  const [selectedScoreId, setSelectedScoreId] = useState("");

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

  // At startup, fetch list of available scores from the backend
  useEffect(() => {
    fetch("http://localhost:8000/scores")
      .then(res => res.json())
      .then(setScores)
      .catch(err => console.error("Error fetching scores:", err));
  }, []);

  // Load score when selected from the dropdown
  const handleScoreChange = (e) => {
    const scoreId = e.target.value;
    setSelectedScoreId(scoreId);
    fetch(`http://localhost:8000/scores/${scoreId}`)
      .then(res => res.json())
      .then(score => {
        if (scoreRef.current && score) {
          scoreRef.current.loadScore(score);
        }
      })
      .catch(err => console.error("Error loading score:", err));
  };


  // Send keypress events to backend when in 'keyboard' mode
  useEffect(() => {
    const noteKeys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
    const octaveKeys = ["z", "m"];

    const handleKeyDown = (event) => {
      console.log("Key down event:", event);
      if (inputMode === "keyboard" && socket?.readyState === WebSocket.OPEN) {
        const key = event.key.toLowerCase();
        if (noteKeys.includes(key)) {
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
        if (noteKeys.includes(key)) {
          socket.send(JSON.stringify({
            type: "key_up",
            key: key,
          }));
        }
      }
    };

    const handleKeyPress = (event) => {
      console.log("Key press event:", event);
      if (inputMode === "keyboard" && socket?.readyState === WebSocket.OPEN) {
        const key = event.key.toLowerCase();
        if (octaveKeys.includes(key)) {
          socket.send(JSON.stringify({
            type: "key_press",
            key: key,
          }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, [inputMode, socket]);

  return (
    <div className="text-center mt-24">
      <h1 className="text-3xl font-bold mb-6">MIDI Listener</h1>
      <select
        className="mb-4 p-2 border"
        value={selectedScoreId}
        onChange={handleScoreChange}
      >
        <option value="">-- Select a score --</option>
        {scores.map(score => (
          <option key={score.id} value={score.id}>
            {score.title}
          </option>
        ))}
      </select>

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
