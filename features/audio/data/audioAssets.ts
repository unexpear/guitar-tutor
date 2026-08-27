/**
 * Guitar reference samples, generated from scripts/generate-samples.js.
 *
 * Assets are resolved lazily: the map only holds module specifiers, and the
 * actual `require` (a Metro thing) runs when a note is played. Importing this
 * module is therefore safe anywhere — including the test runner — and only
 * requesting a note on a device pulls a WAV in. C2..E6 covers the tuner's
 * range and every string of every preset.
 */

const PITCH_CLASSES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

/** Octaves 2..5 are complete; octave 6 goes up to E. */
const NOTE_NAMES: string[] = [];
for (const octave of [2, 3, 4, 5]) {
  for (const pc of PITCH_CLASSES) NOTE_NAMES.push(`${pc}${octave}`);
}
for (const pc of ['C', 'C#', 'D', 'D#', 'E'] as const) NOTE_NAMES.push(`${pc}6`);

/** The note names this app can actually produce sound for. */
export const SAMPLE_NOTES: string[] = NOTE_NAMES;

const ASSETS: Record<string, string> = Object.fromEntries(
  NOTE_NAMES.map((note) => [note, `../../../assets/audio/${note}.wav`])
);

/**
 * The asset for a note, or null when there is no sample for it.
 * The `require` only executes when the sample is actually requested, so this
 * is callable from tests too (non-existent notes just return null without
 * touching the filesystem or the bundler).
 */
export function sampleForNote(note: string): number | string | null {
  const spec = ASSETS[note];
  return spec === undefined ? null : (require(spec) as number | string);
}