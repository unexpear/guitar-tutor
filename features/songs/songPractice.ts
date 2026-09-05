import { Drill } from '../lessons/data/drills';
import { Song, SongEvent } from './data/songs';
import { chordMidiNotes, getChord, OPEN_STRING_MIDI, stringFretToMidi } from '../chords/data/chords';

export function guideChordMidiNotes(name: string, transposeSemitones: number, capo: number): number[] {
  const shape = transposeChordName(name, transposeSemitones - capo);
  const chord = shape ? getChord(shape) : undefined;
  return chord ? chordMidiNotes(chord).map(midi => midi + capo) : [];
}
import { findBarres } from '../chords/data/barres';

export const SONG_PRACTICE_PREFIX = 'song-practice:';

export function songPracticeScoreKey(songId: string): string {
  return `${SONG_PRACTICE_PREFIX}${songId}`;
}

export interface SongPracticeOptions {
  /** Null means the complete arrangement. */
  sectionId: string | null;
  /** Playback speed without changing the notated relationship of the beats. */
  tempoPercent: 50 | 75 | 100 | 125;
  /** A capo changes the sounding key while the displayed shapes stay familiar. */
  capo: number;
  /** Changes the sounding key; capo choices then choose easier shapes for it. */
  transposeSemitones?: number;
}

export const DEFAULT_SONG_PRACTICE_OPTIONS: SongPracticeOptions = {
  sectionId: null,
  tempoPercent: 75,
  capo: 0,
  transposeSemitones: 0,
};

const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ROOT_TO_PITCH: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

export function transposeKey(key: string, semitones: number): string {
  const match = /^([A-G](?:#|b)?)(.*)$/.exec(key.trim());
  if (!match) return key;
  const pitch = ROOT_TO_PITCH[match[1]];
  if (pitch === undefined) return key;
  const shifted = ((pitch + Math.round(semitones)) % 12 + 12) % 12;
  return `${CHROMATIC_SHARP[shifted]}${match[2]}`;
}

export function soundingKeyForCapo(key: string, capo: number): string {
  return transposeKey(key, Math.min(11, Math.max(0, Math.round(capo))));
}

const PITCH_SPELLINGS: readonly (readonly string[])[] = [
  ['C'], ['C#', 'Db'], ['D'], ['D#', 'Eb'], ['E'], ['F'],
  ['F#', 'Gb'], ['G'], ['G#', 'Ab'], ['A'], ['A#', 'Bb'], ['B'],
];

function chordParts(chordName: string): { root: string; suffix: string } | null {
  const match = /^([A-G](?:#|b)?)(.*)$/.exec(chordName);
  if (!match) return null;
  // A named voicing such as G (320033) is still a major G when moved; the
  // coordinate hint only applies to its original position.
  return { root: match[1], suffix: match[2].startsWith(' (') ? '' : match[2] };
}

export function transposeChordName(chordName: string, semitones: number): string | null {
  if (((Math.round(semitones) % 12) + 12) % 12 === 0) return chordName;
  const parts = chordParts(chordName);
  if (!parts) return null;
  const pitch = ROOT_TO_PITCH[parts.root];
  if (pitch === undefined) return null;
  const shifted = ((pitch + Math.round(semitones)) % 12 + 12) % 12;
  for (const spelling of PITCH_SPELLINGS[shifted]) {
    const candidate = `${spelling}${parts.suffix}`;
    if (getChord(candidate)) return candidate;
  }
  return null;
}

export interface CapoChoice {
  capo: number;
  shapeKey: string;
  shapes: string[];
  difficulty: number;
}

export function transposeNoteEvent(
  event: Extract<SongEvent, { kind: 'note' }>,
  semitones: number,
): Extract<SongEvent, { kind: 'note' }> {
  const targetMidi = stringFretToMidi(event.stringIndex, event.fret) + Math.round(semitones);
  const candidates = OPEN_STRING_MIDI.flatMap((openMidi, stringIndex) =>
    Array.from({ length: 16 }, (_, fret) => ({ stringIndex, fret, midi: openMidi + fret })))
    .filter((candidate) => ((candidate.midi - targetMidi) % 12 + 12) % 12 === 0)
    .sort((a, b) =>
      Math.abs(a.midi - targetMidi) - Math.abs(b.midi - targetMidi) ||
      Math.abs(a.stringIndex - event.stringIndex) - Math.abs(b.stringIndex - event.stringIndex) ||
      Math.abs(a.fret - event.fret) - Math.abs(b.fret - event.fret));
  const choice = candidates[0] ?? { stringIndex: event.stringIndex, fret: event.fret };
  const stringLabels = ['E', 'A', 'D', 'G', 'B', 'e'];
  return {
    ...event,
    stringIndex: choice.stringIndex,
    fret: choice.fret,
    label: `${stringLabels[choice.stringIndex]}${choice.fret}`,
  };
}

/** Valid capo positions that preserve the requested sounding key. */
export function capoChoicesForSong(song: Song, transposeSemitones = 0): CapoChoice[] {
  if (!song.arrangement) return [];
  const sourceShapes = [...new Set(
    arrangementEvents(song, null)
      .filter((event): event is Extract<SongEvent, { kind: 'chord' }> => event.kind === 'chord')
      .map((event) => event.chordName),
  )];
  if (sourceShapes.length === 0) {
    return [{
      capo: 0,
      shapeKey: transposeKey(song.key, transposeSemitones),
      shapes: [],
      difficulty: 0,
    }];
  }
  const choices: CapoChoice[] = [];
  // Eleven frets guarantees that every pitch-class transposition can retain
  // the authored shapes when the chord library has no direct alternative.
  for (let capo = 0; capo <= 11; capo += 1) {
    const shift = transposeSemitones - capo;
    const shapes = sourceShapes.map((name) => transposeChordName(name, shift));
    if (shapes.some((name) => name === null)) continue;
    const complete = shapes as string[];
    const difficulty = complete.reduce((total, name) => {
      const chord = getChord(name)!;
      const highest = Math.max(...chord.strings);
      return total + highest + findBarres(chord).length * 6;
    }, 0);
    choices.push({
      capo,
      shapeKey: transposeKey(song.key, shift),
      shapes: complete,
      difficulty,
    });
  }
  return choices.sort((a, b) => a.difficulty - b.difficulty || a.capo - b.capo);
}

export function arrangementEvents(song: Song, sectionId: string | null): SongEvent[] {
  const arrangement = song.arrangement;
  if (!arrangement) return [];
  const selected = sectionId
    ? arrangement.sections.filter((candidate) => candidate.id === sectionId)
    : arrangement.sections;
  // Saved section IDs can outlive a catalogue update. Recover to the full chart.
  return (selected.length ? selected : arrangement.sections).flatMap((candidate) => candidate.events);
}

export function songPracticeFeedback(score: number): string {
  if (score >= 90) return 'Performance ready. Try 100% speed or a harder section next.';
  if (score >= 75) return 'Nearly steady. Loop the weakest section once before another full run.';
  if (score >= 50) return 'Slow to 75% and use Follow Me so every clean change gets credit.';
  return 'Make it smaller: choose one section, use 50% speed, and practise its first two shapes.';
}

export function songCorrectionIssueUrl(song: Song, message: string): string {
  const title = `Practice chart: ${song.title}`;
  const body = [
    `Chart: ${song.title}`,
    `Chart license: ${song.arrangement?.license ?? 'reference only'}`,
    '',
    'Suggested correction or playing tip:',
    message.trim(),
    '',
    '_Submitted from StandardTune for public community review._',
  ].join('\n');
  return `https://github.com/unexpear/guitar-tutor/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

/**
 * Builds an original chord-set exercise from a song reference. This is
 * intentionally not a transcription, tempo map, or reconstruction of the
 * copyrighted recording's arrangement.
 */
export function buildSongPracticeDrill(
  song: Song,
  options: SongPracticeOptions = DEFAULT_SONG_PRACTICE_OPTIONS,
): Drill {
  if (song.arrangement) {
    const events = arrangementEvents(song, options.sectionId);
    const tempoPercent = [50, 75, 100, 125].includes(options.tempoPercent)
      ? options.tempoPercent
      : 75;
    const bpm = Math.round(song.arrangement.bpm * (tempoPercent / 100));
    const section = options.sectionId
      ? song.arrangement.sections.find((candidate) => candidate.id === options.sectionId)
      : undefined;
    const shapeShift = (options.transposeSemitones ?? 0) - options.capo;
    return {
      lessonId: songPracticeScoreKey(song.id),
      title: `${song.title}${section ? ` · ${section.label}` : ''}`,
      intro:
        `Generic CC0 practice exercise at ${tempoPercent}% speed. ` +
        'Follow Me waits for each target; Play in Time keeps the finger guide locked to the chart. The moving lane scrolls as you play.',
      targets: events.map((event) =>
        event.kind === 'chord'
          ? {
              kind: 'chord' as const,
              chordName: transposeChordName(event.chordName, shapeShift) ?? event.chordName,
              label: transposeChordName(event.chordName, shapeShift) ?? event.chordName,
              strums: event.beats,
              beats: event.beats,
              capo: options.capo,
            }
          : transposeNoteEvent(event, options.transposeSemitones ?? 0),
      ),
      defaultMode: events.some((event) => event.kind === 'chord') ? 'poly' : 'mono',
      // Song targets carry exact beat lengths. This remains a safe fallback.
      secondsPerTarget: 60 / Math.max(1, bpm),
      bpm,
      beatsPerBar: song.arrangement.beatsPerBar,
    };
  }

  const pass = song.chords.map((chordName) => ({
    kind: 'chord' as const,
    chordName,
    label: chordName,
  }));

  return {
    lessonId: songPracticeScoreKey(song.id),
    title: `${song.title} · Chord Practice`,
    intro:
      'This is an original chord-set exercise, not the song arrangement. Play every required chord twice through. Follow Me waits for you; Play in Time keeps the changes moving.',
    targets: [...pass, ...pass.map((target) => ({ ...target }))],
    defaultMode: 'poly',
    secondsPerTarget: 6,
  };
}
