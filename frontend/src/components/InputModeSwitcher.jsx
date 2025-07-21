import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

const InputModeSwitcher = ({ socket }) => {
  const [mode, setMode] = useState("midi");

  const toggleMode = () => {
    const newMode = mode === "midi" ? "keyboard" : "midi";
    setMode(newMode);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "mode_switch", input: newMode }));
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={toggleMode} variant="outline">
        Input: {mode.toUpperCase()}
      </Button>
    </div>
  );
};

export default InputModeSwitcher;
