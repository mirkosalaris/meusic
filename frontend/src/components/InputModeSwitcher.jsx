import React from 'react';

const InputModeSwitcher = ({ socket, inputMode, onModeChange }) => {
  const toggleMode = () => {
    const newMode = inputMode === "midi" ? "keyboard" : "midi";
    onModeChange(newMode);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "mode_switch", input: newMode }));
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 50 }}>
      <button onClick={toggleMode} style={{
        padding: '0.5rem 1rem',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#f0f0f0',
        cursor: 'pointer',
      }}>
        Input: {inputMode.toUpperCase()}
      </button>
    </div>
  );
};

export default InputModeSwitcher;
