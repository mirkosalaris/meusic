import React from 'react';
import { Button } from './ui/button';

const InputModeSwitcher = ({ socket, inputMode, onModeChange }) => {
  const toggleMode = () => {
    const newMode = inputMode === "midi" ? "keyboard" : "midi";
    onModeChange(newMode);
    console.log("Switching input mode to:", newMode);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "mode_switch", input: newMode }));
    }
  };

	return (
			<div className="fixed bottom-4 right-4 z-50">
				<Button	onClick={toggleMode} variant="outline">
					Input: {inputMode.toUpperCase()}
				</Button>
			</div>
		);
};

export default InputModeSwitcher;
