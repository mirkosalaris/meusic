import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Renderer, Stave, StaveNote, Accidental, Formatter} from 'vexflow';

const MIDI_TO_NOTE = {
  21: "a0", 22: "a#0", 23: "b0",
  24: "c1", 25: "c#1", 26: "d1", 27: "d#1", 28: "e1", 29: "f1", 30: "f#1", 31: "g1", 32: "g#1", 33: "a1", 34: "a#1", 35: "b1",
  36: "c2", 37: "c#2", 38: "d2", 39: "d#2", 40: "e2", 41: "f2", 42: "f#2", 43: "g2", 44: "g#2", 45: "a2", 46: "a#2", 47: "b2",
  48: "c3", 49: "c#3", 50: "d3", 51: "d#3", 52: "e3", 53: "f3", 54: "f#3", 55: "g3", 56: "g#3", 57: "a3", 58: "a#3", 59: "b3",
  60: "c4", 61: "c#4", 62: "d4", 63: "d#4", 64: "e4", 65: "f4", 66: "f#4", 67: "g4", 68: "g#4", 69: "a4", 70: "a#4", 71: "b4",
  72: "c5", 73: "c#5", 74: "d5", 75: "d#5", 76: "e5", 77: "f5", 78: "f#5", 79: "g5", 80: "g#5", 81: "a5", 82: "a#5", 83: "b5",
  84: "c6", 85: "c#6", 86: "d6", 87: "d#6", 88: "e6", 89: "f6", 90: "f#6", 91: "g6", 92: "g#6", 93: "a6", 94: "a#6", 95: "b6",
  96: "c7", 97: "c#7", 98: "d7", 99: "d#7", 100: "e7", 101: "f7", 102: "f#7", 103: "g7", 104: "g#7", 105: "a7", 106: "a#7", 107: "b7",
  108: "c8"
};

function midiToVexflowNote(midi) {
  const name = MIDI_TO_NOTE[midi];
  if (!name) return null;
  const [letter, octave] = name.length === 3 ? [name.slice(0, 2), name[2]] : [name[0], name[1]];
  const key = [letter + '/' + octave];
	console.log("Converted MIDI", midi, "to VexFlow note", key);
  const note = new StaveNote({ keys: key, duration: "q" });
	if (letter.includes("#")) {
		note.addModifier(new Accidental("#"), 0);
	}
  return note;
}

const ScoreRenderer = forwardRef((_, ref) => {
  const containerRef = useRef(null);
  const activeNotesRef = useRef(new Set());
  const rendererRef = useRef(null);
  const contextRef = useRef(null);

  const drawScore = () => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(800, 200);
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');

    const stave = new Stave(10, 40, 780);
    stave.addClef('treble').addTimeSignature('4/4');
    stave.setContext(context).draw();

    const notes = Array.from(activeNotesRef.current)
      .map((midi) => midiToVexflowNote(midi))
      .filter(Boolean);

    if (notes.length > 0) {
      Formatter.FormatAndDraw(context, stave, notes);
    }

    rendererRef.current = renderer;
    contextRef.current = context;
  };

  useImperativeHandle(ref, () => ({
    handleMIDIMessage(msg) {
      if (msg.type !== "note_on") return;

      const isNoteOff = msg.velocity === 0;
      const noteSet = activeNotesRef.current;

      if (isNoteOff) {
        noteSet.delete(msg.note);
      } else {
        noteSet.add(msg.note);
      }

      drawScore();
    }
  }));

  useEffect(() => {
    drawScore();
  }, []);

  return (
    <div className="w-full flex justify-center mt-8">
      <div ref={containerRef} className="p-4 bg-white" />
    </div>
  );
});

export default ScoreRenderer;



/*
import React, { useEffect, useRef } from 'react';
import {
  Renderer,
  Stave
} from 'vexflow';

const ScoreRenderer = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    const width = 800;
    const height = 130; // things are chopped at 120 or below and any attempt at using renderer.scale() is not working greatly

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
		
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');
		// renderer.resize(width, height);

    const stave = new Stave(10, 40, width - 20);
    stave.addClef('treble').addTimeSignature('4/4');
    stave.setContext(context).draw();
  }, []);

  return (
    <div className="w-full flex justify-center mt-8">
      <div
        ref={containerRef}
        className="p-4 bg-white"
      />
    </div>
  );
};

export default ScoreRenderer;
*/