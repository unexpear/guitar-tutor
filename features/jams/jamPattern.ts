import {
  chordBassMidi,
  chordMidiNotes,
  getChord,
  midiToNoteName,
} from '../chords/data/chords';
import type { JamTrack } from './jams';
import { jamChordAt } from './jams';

export type DrumHit = 'kick' | 'snare' | 'hat';

export interface JamBeatEvent {
  /** Chord for this bar (always set). */
  chordName: string;
  drums: readonly DrumHit[];
  /** One bass note, or null on a rest. */
  bassNote: string | null;
  /** Chord notes to strum, or null when this beat has no guitar. */
  guitarNotes: readonly string[] | null;
}

/** Lower a MIDI pitch into the bass register without going below E1. */
export function bassRegisterMidi(midi: number): number {
  let value = midi;
  while (value > 43) value -= 12; // above G2 → drop
  while (value < 28) value += 12; // below E1 → raise
  return value;
}

/** Root on 1 and 3, fifth on 2 and 4 (or the chord's lowest string if no fifth). */
export function bassNoteForBeat(chordName: string, beatInBar: number): string | null {
  const chord = getChord(chordName);
  if (!chord) return null;
  const root = bassRegisterMidi(chordBassMidi(chord));
  const fifth = bassRegisterMidi(root + 7);
  const beat = ((beatInBar % 4) + 4) % 4;
  if (beat === 0 || beat === 2) return midiToNoteName(root);
  if (beat === 1 || beat === 3) return midiToNoteName(fifth);
  return null;
}

export function guitarNotesForChord(chordName: string): string[] | null {
  const chord = getChord(chordName);
  if (!chord) return null;
  return chordMidiNotes(chord).map(midiToNoteName);
}

/**
 * Quarter-note rock/pop groove for a 4/4 jam bar.
 * Beat 0: kick + hat + root + full chord
 * Beat 1: hat + fifth
 * Beat 2: snare + hat + root + light chord restrike
 * Beat 3: hat + fifth
 */
export function jamBeatEvent(
  jam: JamTrack,
  barIndex: number,
  beatInBar: number,
): JamBeatEvent {
  const chordName = jamChordAt(jam, barIndex);
  const beat = ((beatInBar % 4) + 4) % 4;
  const drums: DrumHit[] =
    beat === 0 ? ['kick', 'hat'] : beat === 2 ? ['snare', 'hat'] : ['hat'];
  const guitarNotes =
    beat === 0 || beat === 2 ? guitarNotesForChord(chordName) : null;
  return {
    chordName,
    drums,
    bassNote: bassNoteForBeat(chordName, beat),
    guitarNotes,
  };
}
