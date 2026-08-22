import { Target, DetectionMode } from '../playalong/matcher';

export interface Drill {
  /** Lesson this drill belongs to. */
  lessonId: string;
  title: string;
  intro: string;
  targets: Target[];
  /** Default detection mode for chord targets ('mono' = any chord tone counts). */
  defaultMode: DetectionMode;
  /** Flow-mode seconds allowed per target (wait mode ignores this). */
  secondsPerTarget: number;
  /**
   * When set, the drill runs to a click track at this tempo and grades how
   * close each strum lands to the beat. Only meaningful for strum drills.
   */
  bpm?: number;
  /** Beats per bar for the click track. */
  beatsPerBar?: number;
}

const note = (stringIndex: number, fret: number, label: string): Target => ({
  kind: 'note',
  stringIndex,
  fret,
  label,
});

const chord = (chordName: string, strums = 1): Target => ({
  kind: 'chord',
  chordName,
  label: chordName,
  strums,
});

export const DRILLS: Record<string, Drill> = {
  'beginner-reading-tabs': {
    lessonId: 'beginner-reading-tabs',
    title: 'First Notes',
    intro:
      'Pluck one string at a time. The tab strip shows which string, the number is the fret (0 = open). Take your time - each note waits for you.',
    targets: [
      note(0, 0, 'E0'),
      note(0, 3, 'E3'),
      note(1, 0, 'A0'),
      note(1, 2, 'A2'),
      note(2, 0, 'D0'),
      note(2, 2, 'D2'),
      note(3, 0, 'G0'),
      note(4, 0, 'B0'),
      note(5, 0, 'e0'),
      note(5, 3, 'e3'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 4,
  },
  'beginner-open-chords': {
    lessonId: 'beginner-open-chords',
    title: 'Chord Changes',
    intro:
      'Form each chord with the diagram and strum once. In Easy mode any chord tone counts; Full chord mode listens for several strings of the chord.',
    targets: [
      chord('Em'),
      chord('Am'),
      chord('Em'),
      chord('D'),
      chord('G'),
      chord('C'),
      chord('G'),
      chord('Am'),
      chord('C'),
      chord('Em'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 6,
  },
  'beginner-basic-strumming': {
    lessonId: 'beginner-basic-strumming',
    title: 'Strum Along',
    intro:
      'Hold each chord and strum on every click - four strums per chord. A count-in leads you in, then the app grades how close each strum lands to the beat.',
    targets: [
      chord('Em', 4),
      chord('Am', 4),
      chord('Em', 4),
      chord('D', 4),
      chord('G', 4),
      chord('Em', 4),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 10,
    bpm: 70,
    beatsPerBar: 4,
  },
  'intermediate-barre-chords': {
    lessonId: 'intermediate-barre-chords',
    title: 'Barre Check',
    intro:
      'Full chord mode is on, because the whole question with a barre is whether every string actually rings. If a hit will not register, your index finger is not flat enough - roll it slightly onto its side and try again.',
    targets: [
      chord('F'),
      chord('Bb'),
      chord('F#m'),
      chord('Bm'),
      chord('Gm'),
      chord('F'),
    ],
    defaultMode: 'poly',
    secondsPerTarget: 12,
  },
  'intermediate-fingerpicking': {
    lessonId: 'intermediate-fingerpicking',
    title: 'p-i-m-a-m-i',
    intro:
      'The rolling six-note pattern from the lesson, over Em then C. Hold the chord and pick one string per click at 50 BPM - bass, G, B, e, B, G. Slow and even beats fast and lumpy.',
    targets: [
      note(0, 0, 'Em bass'),
      note(3, 0, 'G'),
      note(4, 0, 'B'),
      note(5, 0, 'e'),
      note(4, 0, 'B'),
      note(3, 0, 'G'),
      note(1, 3, 'C bass'),
      note(3, 0, 'G'),
      note(4, 1, 'C'),
      note(5, 0, 'e'),
      note(4, 1, 'C'),
      note(3, 0, 'G'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 6,
    bpm: 50,
    beatsPerBar: 6,
  },
  'intermediate-scales-101': {
    lessonId: 'intermediate-scales-101',
    title: 'C Major, One Octave',
    intro:
      'The position from the lesson: A string 3-5-7, D string 3-5-7, G string 4-5. One finger per fret. Say each note name aloud as you play it, then run it back down.',
    targets: [
      note(1, 3, 'C'),
      note(1, 5, 'D'),
      note(1, 7, 'E'),
      note(2, 3, 'F'),
      note(2, 5, 'G'),
      note(2, 7, 'A'),
      note(3, 4, 'B'),
      note(3, 5, 'C'),
      note(3, 4, 'B'),
      note(2, 7, 'A'),
      note(2, 5, 'G'),
      note(2, 3, 'F'),
      note(1, 7, 'E'),
      note(1, 5, 'D'),
      note(1, 3, 'C'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 5,
  },
  'intermediate-music-theory': {
    lessonId: 'intermediate-music-theory',
    title: 'The Family of G',
    intro:
      'Every chord that belongs to the key of G, in order: G, Am, Bm, C, D, Em. Play them as a set and listen to how the three minors sit against the three majors - that is what a key sounds like.',
    targets: [
      chord('G'),
      chord('Am'),
      chord('Bm'),
      chord('C'),
      chord('D'),
      chord('Em'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'advanced-improvisation': {
    lessonId: 'advanced-improvisation',
    title: 'The Pentatonic Box',
    intro:
      'A minor pentatonic at the 5th fret, up and back. This is the vocabulary; the lesson is about what you say with it. Once the box is automatic, stop running it in order.',
    targets: [
      note(0, 5, 'A'),
      note(0, 8, 'C'),
      note(1, 5, 'D'),
      note(1, 7, 'E'),
      note(2, 5, 'G'),
      note(2, 7, 'A'),
      note(3, 5, 'C'),
      note(3, 7, 'D'),
      note(4, 5, 'E'),
      note(4, 8, 'G'),
      note(5, 5, 'A'),
      note(5, 8, 'C'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 5,
  },
  'advanced-techniques': {
    lessonId: 'advanced-techniques',
    title: '5h7p5, Every String',
    intro:
      'The trill from the lesson, string by string: fret 5, hammer to 7, pull back to 5. The app hears pitch, not technique - so it cannot tell a hammer-on from a picked note. What it can tell you is whether the hammered note sounded at all, which is the thing beginners get wrong.',
    targets: [
      note(0, 5, 'E5'),
      note(0, 7, 'E7'),
      note(1, 5, 'A5'),
      note(1, 7, 'A7'),
      note(2, 5, 'D5'),
      note(2, 7, 'D7'),
      note(3, 5, 'G5'),
      note(3, 7, 'G7'),
      note(4, 5, 'B5'),
      note(4, 7, 'B7'),
      note(5, 5, 'e5'),
      note(5, 7, 'e7'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 5,
  },
  'advanced-songwriting': {
    lessonId: 'advanced-songwriting',
    title: 'Four Chords, Two Orders',
    intro:
      'The same four chords twice: first as I-V-vi-IV, then starting on the vi. Same notes, completely different mood - which is the constraint the lesson asks you to write inside.',
    targets: [
      chord('C', 4),
      chord('G', 4),
      chord('Am', 4),
      chord('F', 4),
      chord('Am', 4),
      chord('F', 4),
      chord('C', 4),
      chord('G', 4),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 12,
    bpm: 60,
    beatsPerBar: 4,
  },
};

export function getDrill(lessonId: string): Drill | undefined {
  return DRILLS[lessonId];
}
