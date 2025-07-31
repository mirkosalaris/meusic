# Custom JSON Format for Musical Scores

## Overview

This document describes the custom JSON format used to represent musical scores

## Format Structure

### Top-Level Keys

- `version`: a string containing a n.m value coherent with the used schema.
- `title`: a string expressing the title of the score.
- `measures`: An array of measures. Each measure contains:
  - `time_signature`: (optional, required only in the first measure) A string like `"4/4"` representing the time signature. If omitted in subsequent measures, it is inherited from the previous one.
  - `contents`: A list of note or chord events in the measure.

### Note Events

Each object inside `contents` must have:

- `time` (float): The start time of the note, in units of quarter notes (e.g. `0.0`, `1.5`, etc.).
- `notes` (array of strings): Pitch and octave, e.g. `["c4"]` for a single note or `["c4", "e4", "g4"]` for a chord.
- `duration` (string): Note duration, must be one of the following values:
  - `"w"` (whole note)
  - `"h"` (half note)
  - `"q"` (quarter note)
  - `"8"` (eighth note)
  - `"16"` (sixteenth note)
  - `"32"` (thirty-second note)
- `dots` (optional integer): The number of augmentation dots (e.g. `1` for dotted notes).

### Rules

- All notes within a measure should cumulatively respect the time signature.
- If `time_signature` is omitted in a measure, it inherits the value from the previous one.
- `notes` array must have at least one entry.

## Example 1: Basic Measure

```json
{
	"version": "0.0",
  "title": "basic measure",
  "measures": [
    {
      "time_signature": "4/4",
      "contents": [
        { "time": 0.0, "notes": ["c4"], "duration": "q" },
        { "time": 1.0, "notes": ["d4"], "duration": "q", "dots": 1 },
        { "time": 2.5, "notes": ["e4"], "duration": "q" },
        { "time": 3.5, "notes": ["c4"], "duration": "8" }
      ]
    }
  ]
}
```

## Example 2: Multiple Measures with Inherited Time Signature

```json
{
  "version": "0.0",
  "title": "multiple measures with inherited time signature",
  "measures": [
    {
      "time_signature": "3/4",
      "contents": [
        { "time": 0.0, "notes": ["g4"], "duration": "h" },
        { "time": 2.0, "notes": ["b4"], "duration": "q" }
      ]
    },
    {
      "contents": [
        { "time": 0.0, "notes": ["a4", "c5"], "duration": "q" },
        { "time": 1.0, "notes": ["f4"], "duration": "q" },
        { "time": 2.0, "notes": ["e4"], "duration": "q" }
      ]
    }
  ]
}
```