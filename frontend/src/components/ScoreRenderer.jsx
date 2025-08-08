import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {emptyScore} from '../utils/scoreUtils';
import {SCALE_FACTOR, drawScore, drawActiveNotes} from '../utils/scoreDrawing';

const ScoreRenderer = forwardRef((_, ref) => {
  const containerRef = useRef(null);
  const activeNotesRef = useRef(new Set());
  const contextRef = useRef(null);
  const activeStaveRef = useRef(null);

  const [score, setScore] = useState(emptyScore);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  function handleMIDIMessage(msg) {
    if (msg.type !== "note_on") return;

    const isNoteOff = msg.velocity === 0;
    const noteSet = activeNotesRef.current;

    if (isNoteOff) {
      noteSet.delete(msg.note);
    } else {
      noteSet.add(msg.note);
    }

    redrawAll();
  }

  function loadScore(newScore) {
    setScore(newScore || emptyScore);
  }

  function redrawAll() {
    drawScore(
      {
        container: containerRef.current,
        score,
        viewportWidth,
        activeStaveRef,
        contextRef
      }
    );
    drawActiveNotes(
      {
        context: contextRef.current,
        stave: activeStaveRef.current,
        activeMIDINotes: Array.from(activeNotesRef.current)
      }
    );
  }

  useImperativeHandle(ref, () => ({
    handleMIDIMessage,
    loadScore
  }));

  useEffect(() => {
    drawScore(
      {
        container: containerRef.current,
        score,
        viewportWidth,
        activeStaveRef,
        contextRef
      });
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