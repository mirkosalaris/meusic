import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Renderer, Stave, StaveNote, Accidental, Formatter, Dot, Voice } from 'vexflow';

const SCALE_FACTOR = 2.0;
const MEASURE_WIDTH = 150;
const MEASURE_PADDING = 2;
const STAVE_HEIGHT = 250;

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

const emptyScore = {
  version: "0.0",
  title: "empty",
  bpm: 120,
  measures: [
    {
      key_signature: "C",
      time_signature: null,
      contents: [],
      free_time: true
    }
  ]
};

function midiToVexflowKey(midi) {
  const name = MIDI_TO_NOTE[midi];
  if (!name) return null;

  const [letter, octave] = name.length === 3
    ? [name.slice(0, 2), name[2]]
    : [name[0], name[1]];

  return {
    key: `${letter}/${octave}`,
    accidental: letter.includes('#') ? '#' : null
  };
}

function buildChord(keys, accidentals, duration, style) {
  const chord = new StaveNote({ keys, duration });
  accidentals.forEach((acc, i) => {
    if (acc) chord.addModifier(new Accidental(acc), i);
  });
  if (style) chord.setStyle(style);
  return chord;
}

const ScoreRenderer = forwardRef((_, ref) => {
  const containerRef = useRef(null);
  const activeNotesRef = useRef(new Set());
  const contextRef = useRef(null);
  const activeStaveRef = useRef(null);
  const [score, setScore] = useState(emptyScore);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  const initRenderer = (container, score) => {
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');

    // managing here the scale is a mess. Use css transform
    context.scale(1, 1);

    // total width = all measures in a row
    const totalWidth = score.measures.length * (MEASURE_WIDTH + MEASURE_PADDING);

    // Compute initial offset so first measure is centered in view
    const firstMeasureOffset = Math.max(0, (viewportWidth / SCALE_FACTOR / 2) - (MEASURE_WIDTH / 2));

    renderer.resize(totalWidth + firstMeasureOffset, STAVE_HEIGHT);
    return { renderer, context, firstMeasureOffset };
  };

  const createStave = (x, y, width, { index, measure, previousKeySig, previousTimeSig, context }) => {
    const stave = new Stave(x, y, width);
    if (index === 0) stave.addClef('treble');
    // time and key signatures are inherited when not specified
    if (measure.key_signature && measure.key_signature !== previousKeySig) {
      stave.addKeySignature(measure.key_signature);
    }
    if (measure.time_signature && measure.time_signature !== previousTimeSig) {
      stave.addTimeSignature(measure.time_signature);
    }
    stave.setContext(context).draw();
    return stave;
  };

  const buildNotes = (measure) => {
    return measure.contents.map(entry => {
      const isRest = entry.notes.length === 0;
      const duration = isRest ? `${entry.duration}r` : entry.duration;
      const keys = isRest
        ? ['b/4'] // dummy note for rests
        : entry.notes.map(noteStr => {
          // Parse note: e.g. "F#4" -> { letter: 'f', accidental: '#', octave: '4' }
          const match = noteStr.match(/^([A-Ga-g])([#b]?)(\d)$/);
          if (!match) throw new Error(`Invalid note format: ${noteStr}`);
          const [, letter, accidental, octave] = match;
          return `${letter.toLowerCase()}${accidental}/${octave}`;
        });

      const staveNote = new StaveNote({
        keys,
        duration: duration,
        dots: entry.dots || 0
      });

      // Store accidental info in staveNote for applyAccidentals
      if (!isRest) {
        keys.forEach((key, i) => {
          const accidentalChar = key.length === 4 ? key[1] : null;
          if (accidentalChar === "#" || accidentalChar === "b") {
            staveNote.addModifier(new Accidental(accidentalChar), i);
          }
        });
      }
      for (let i = 0; i < (entry.dots || 0); i++) {
        Dot.buildAndAttach([staveNote], { all: true });
      }
      return staveNote;
    });
  };

  const drawMeasure = ({ context, stave, notes, keySignature }) => {
    if (notes.length > 0) {
      const voice = new Voice();
      // Disable checking because I can't get it to work with non 4/4 time signatures
      voice.setMode(Voice.Mode.SOFT);
      voice.addTickables(notes);

      // Apply accidentals according to the key signature
      Accidental.applyAccidentals([voice], keySignature);

      new Formatter().joinVoices([voice]).format([voice], MEASURE_WIDTH - 20);
      voice.draw(context, stave);
    }
  };

  const drawScore = () => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const { renderer: _, context, firstMeasureOffset } = initRenderer(container, score);

    let offset = firstMeasureOffset;
    let previousTimeSig = null;
    let previousKeySig = null;

    score.measures.forEach((measure, index) => {
      const stave = createStave(offset, 0, MEASURE_WIDTH, { index, measure, previousKeySig, previousTimeSig, context });
      // store the first stave as the one to draw played notes on
      activeStaveRef.current = index === 0 ? stave : activeStaveRef.current;

      previousKeySig = measure.key_signature || previousKeySig;
      previousTimeSig = measure.time_signature || previousTimeSig;

      const notes = buildNotes(measure);
      drawMeasure({ context, stave, notes, keySignature: previousKeySig });

      offset += MEASURE_WIDTH + MEASURE_PADDING;
    });

    contextRef.current = context;
  };

  const drawActiveNotes = () => {
    const context = contextRef.current;
    const stave = activeStaveRef.current;
    if (!context || !stave) return;

    const activeMIDINotes = Array.from(activeNotesRef.current);
    if (activeMIDINotes.length === 0) return;

    const sorted = activeMIDINotes.sort((a, b) => a - b);
    const keys = [];
    const accidentals = [];

    for (const midi of sorted) {
      const result = midiToVexflowKey(midi);
      if (!result) continue;
      keys.push(result.key);
      accidentals.push(result.accidental);
    }

    const chord = buildChord(
      keys,
      accidentals,
      'q',
      { fillStyle: 'red', strokeStyle: 'red' } // Distinct color for overlay
    );

    Formatter.FormatAndDraw(context, stave, [chord]);
  };

  const redrawAll = () => {
    drawScore();
    drawActiveNotes();
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

      redrawAll();
    },
    loadScore(newScore) {
      setScore(newScore || emptyScore);
    }
  }));

  useEffect(() => {
    drawScore();
  }, [score, viewportWidth]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="bg-white overflow-x-auto">
      <div ref={containerRef} style={{ transform: `scale(${SCALE_FACTOR})`, transformOrigin: 'left top' }} />
    </div>
  );
});

export default ScoreRenderer;