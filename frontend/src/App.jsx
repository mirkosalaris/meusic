import React, { useEffect, useState } from 'react';

function App() {
  const [dotVisible, setDotVisible] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("MIDI note received:", data);
      setDotVisible(true);
      setTimeout(() => setDotVisible(false), 200);
    };
    return () => ws.close();
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>MIDI Listener</h1>
      {dotVisible && <div style={{
        width: '50px', height: '50px',
        backgroundColor: 'green', borderRadius: '50%',
        margin: 'auto'
      }} />}
    </div>
  );
}

export default App;
