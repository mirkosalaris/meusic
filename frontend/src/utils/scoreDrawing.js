import { Renderer, Stave, StaveNote, Accidental, Formatter, Dot, Voice } from 'vexflow';
import { midiToVexflowKey } from './scoreUtils';

export const SCALE_FACTOR = 2.0;
export const MEASURE_WIDTH = 150;
export const MEASURE_PADDING = 2;
export const STAVE_HEIGHT = 250;

export function initRenderer(container, score, viewportWidth) {
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
}

export function createStave(x, y, width, { index, measure, previousKeySig, previousTimeSig, context }) {
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
}

export function buildNotes(measure) {
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
}

export function buildChord(keys, accidentals, duration, style) {
	const chord = new StaveNote({ keys, duration });
	accidentals.forEach((acc, i) => {
		if (acc) chord.addModifier(new Accidental(acc), i);
	});
	if (style) chord.setStyle(style);
	return chord;
}

export function drawMeasure({ context, stave, notes, keySignature }) {
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

export function drawScore({ container, score, viewportWidth, activeStaveRef, contextRef }) {
	if (!container) return;
	container.innerHTML = '';

	const { renderer: _, context, firstMeasureOffset } = initRenderer(container, score, viewportWidth);

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

export function drawActiveNotes({ context, stave, activeMIDINotes }) {
	if (!context || !stave || activeMIDINotes.length === 0) return;

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

