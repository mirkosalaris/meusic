import React from 'react';

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
				<button
					onClick={toggleMode}
					className="px-4 py-2 border border-gray-300 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
				>
					Input: {inputMode.toUpperCase()}
				</button>
			</div>
		);
};

export default InputModeSwitcher;
