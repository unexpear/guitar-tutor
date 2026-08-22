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
};

export function getDrill(lessonId: string): Drill | undefined {
  return DRILLS[lessonId];
}
