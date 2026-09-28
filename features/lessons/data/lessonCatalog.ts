export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  component?: 'guitar-anatomy' | 'chord-diagrams';
}

export interface LessonCategory {
  id: string;
  label: string;
  difficulty: Difficulty;
  lessons: Lesson[];
}

export const LEGACY_LESSON_DATA: LessonCategory[] = [
  {
    id: 'bass-path',
    label: 'Bass Path',
    difficulty: 'beginner',
    lessons: [
      { id: 'bass-first-notes', title: 'Bass Setup & First Notes', description: 'Tune E-A-D-G, set a comfortable playing position, and make clean low notes without fret buzz.', difficulty: 'beginner' },
      { id: 'bass-right-hand', title: 'Alternating Fingers', description: 'Build an even index-middle plucking motion and mute strings that should stay quiet.', difficulty: 'beginner' },
      { id: 'bass-fretboard', title: 'Bass Fretboard Map', description: 'Find roots and octaves on standard four-string bass without memorizing every fret at once.', difficulty: 'beginner' },
      { id: 'bass-groove', title: 'Lock In the Groove', description: 'Use the metronome to place steady roots, rests, and eighth notes around a drum-like pulse.', difficulty: 'beginner' },
    ],
  },
  {
    id: 'beginner',
    label: 'Beginner',
    difficulty: 'beginner',
    lessons: [
      {
        id: 'beginner-holding-the-guitar',
        title: 'Holding the Guitar',
        description:
          'Sit with it properly, work out which hand does what, and hold a pick. Start here if you have never picked one up.',
        difficulty: 'beginner',
      },
      {
        id: 'beginner-tuning-up',
        title: 'Tuning Up',
        description:
          'Check the six standard strings before playing, and learn what the tuner is telling you.',
        difficulty: 'beginner',
      },
      {
        id: 'beginner-guitar-anatomy',
        title: 'Guitar Anatomy',
        description:
          'Learn the parts of your guitar, from headstock to bridge, and understand what each part does.',
        difficulty: 'beginner',
        component: 'guitar-anatomy',
      },
      {
        id: 'beginner-reading-diagrams',
        title: 'Reading Chord Diagrams',
        description:
          'What the dots, numbers, crosses and circles mean, so every chord in the app tells you exactly where your fingers go.',
        difficulty: 'beginner',
        component: 'chord-diagrams',
      },
      {
        id: 'beginner-fretting-notes',
        title: 'Fretting Clean Notes',
        description:
          'Where to put your fingertip, where your thumb goes, and the four reasons a string buzzes. The lesson that stops chords sounding dead.',
        difficulty: 'beginner',
      },
      {
        id: 'beginner-reading-tabs',
        title: 'Reading Tabs',
        description:
          'Read tablature and pluck your first single notes, one string at a time.',
        difficulty: 'beginner',
      },
      {
        id: 'beginner-open-chords',
        title: 'Open Chords',
        description:
          'Play essential open chords like G, C, D, E minor, and A minor to strum your first songs.',
        difficulty: 'beginner',
      },
      {
        id: 'beginner-basic-strumming',
        title: 'Basic Strumming',
        description:
          'Master fundamental strumming patterns using downstrokes and upstrokes with consistent rhythm.',
        difficulty: 'beginner',
      },
    ],
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    difficulty: 'intermediate',
    lessons: [
      {
        id: 'intermediate-barre-chords',
        title: 'Barre Chords',
        description:
          'Unlock the fretboard with movable barre chord shapes and play in any key.',
        difficulty: 'intermediate',
      },
      {
        id: 'intermediate-fingerpicking',
        title: 'Fingerpicking',
        description:
          'Develop finger independence and learn classic fingerpicking patterns for acoustic guitar.',
        difficulty: 'intermediate',
      },
      {
        id: 'intermediate-scales-101',
        title: 'Scales 101',
        description:
          'Learn the major and minor scales to understand melody construction and soloing foundations.',
        difficulty: 'intermediate',
      },
      {
        id: 'intermediate-music-theory',
        title: 'Music Theory',
        description:
          'Explore chord progressions, keys, intervals, and how music is structured.',
        difficulty: 'intermediate',
      },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    difficulty: 'advanced',
    lessons: [
      {
        id: 'advanced-improvisation',
        title: 'Improvisation',
        description:
          'Express yourself freely by learning how to improvise solos over backing tracks.',
        difficulty: 'advanced',
      },
      {
        id: 'advanced-techniques',
        title: 'Advanced Techniques',
        description:
          'Master hammer-ons, pull-offs, slides, bends, vibrato, and tapping.',
        difficulty: 'advanced',
      },
      {
        id: 'advanced-songwriting',
        title: 'Songwriting',
        description:
          'Combine your skills to write original songs with compelling chord progressions and melodies.',
        difficulty: 'advanced',
      },
    ],
  },
];
