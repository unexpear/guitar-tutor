export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface SongChordEvent {
  kind: 'chord';
  chordName: string;
  /** Number of quarter-note beats occupied by this event. */
  beats: number;
}

export interface SongNoteEvent {
  kind: 'note';
  /** Standard guitar string index, low E = 0 and high e = 5. */
  stringIndex: number;
  fret: number;
  label: string;
  beats: number;
}

export type SongEvent = SongChordEvent | SongNoteEvent;

export interface SongSection {
  id: string;
  label: string;
  events: SongEvent[];
}

export interface SongArrangement {
  bpm: number;
  beatsPerBar: number;
  strumPattern: string;
  sections: SongSection[];
  /** Every arrangement shipped here is authored for StandardTune. */
  license: 'CC0-1.0';
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: Difficulty;
  duration: string;
  genre: string;
  /**
   * The chords the song is built from, in the order a player first meets
   * them. Every name here must exist in the chord library — a test enforces
   * it, so a typo cannot ship a song whose diagram is missing.
   *
   * This is a chord reference, not a transcription: no lyrics, no tab, no
   * bar-by-bar arrangement. Which chords a song uses is a plain fact about
   * it, and it is the part a learner actually needs from us.
   */
  chords: string[];
  /** Fret to capo at for these shapes to sound in the original key. */
  capo?: number;
  /** Key the shapes below are played in (with the capo on, where there is one). */
  key: string;
  /** One line on what makes this song worth learning, or what to watch out for. */
  note: string;
  /** Present only when StandardTune can legally provide the full exercise. */
  arrangement?: SongArrangement;
}

const chordEvent = (chordName: string, beats = 4): SongChordEvent => ({
  kind: 'chord',
  chordName,
  beats,
});

const section = (id: string, label: string, chords: string[]): SongSection => ({
  id,
  label,
  events: chords.map((name) => chordEvent(name)),
});

const noteEvent = (
  stringIndex: number,
  fret: number,
  beats = 1,
): SongNoteEvent => ({
  kind: 'note',
  stringIndex,
  fret,
  label: `${['E', 'A', 'D', 'G', 'B', 'e'][stringIndex]}${fret}`,
  beats,
});

const originalArrangement = (
  bpm: number,
  sections: SongSection[],
  strumPattern = '↓ ↓ ↑ ↑ ↓ ↑',
): SongArrangement => ({ bpm, beatsPerBar: 4, strumPattern, sections, license: 'CC0-1.0' });

export const PRACTICE_EXERCISES: Song[] = [
  // Playable exercises made only from common progressions, scales, arpeggios,
  // and mechanical technique patterns. They are not songs or recordings and
  // deliberately avoid lyrics, melodies, hooks, and artist-specific parts.
  {
    id: 'original-first-light',
    title: 'I–V–vi–IV in G',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '1:04',
    genre: 'Chord Progression',
    chords: ['G', 'D', 'Em', 'C'],
    key: 'G',
    note: 'A common four-chord loop. Keep fingers close to the strings and let Follow Me wait while each shape settles.',
    arrangement: originalArrangement(72, [
      section('verse', 'Loop A', ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'C']),
      section('chorus', 'Loop B', ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G']),
    ]),
  },
  {
    id: 'original-two-chord-train',
    title: 'Em–Am Change Loop',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:48',
    genre: 'Chord Change',
    chords: ['Em', 'Am'],
    key: 'Em',
    note: 'Only two shapes, so all your attention can stay on a steady hand and a clean change.',
    arrangement: originalArrangement(80, [
      section('a', 'Round 1', ['Em', 'Em', 'Am', 'Am']),
      section('b', 'Round 2', ['Em', 'Am', 'Em', 'Am']),
    ], '↓ · ↓ ·'),
  },
  {
    id: 'original-open-road',
    title: 'I–IV–V in A',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:58',
    genre: 'Chord Progression',
    chords: ['A', 'D', 'E'],
    key: 'A',
    note: 'Three open major chords with long bars. Aim for relaxed, even downstrokes before adding the upstrokes.',
    arrangement: originalArrangement(88, [
      section('verse', 'Loop', ['A', 'D', 'A', 'E', 'A', 'D', 'E', 'A']),
    ], '↓ ↓ ↓ ↓'),
  },
  {
    id: 'original-rainy-window',
    title: 'i–III–VII–v in A Minor',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '1:12',
    genre: 'Chord Progression',
    chords: ['Am', 'C', 'G', 'Em'],
    key: 'Am',
    note: 'A quiet minor-key loop for smooth changes. Let common fingers stay planted whenever possible.',
    arrangement: originalArrangement(64, [
      section('verse', 'Loop', ['Am', 'C', 'G', 'Em', 'Am', 'C', 'Em', 'Em']),
      section('lift', 'Variation', ['C', 'G', 'Am', 'Em']),
    ]),
  },
  {
    id: 'original-campfire-circle',
    title: 'I–V–vi–IV in C',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:54',
    genre: 'Chord Progression',
    chords: ['C', 'G', 'Am', 'Fmaj7'],
    key: 'C',
    note: 'Uses beginner-friendly Fmaj7 instead of a full F barre, making the classic four-chord family approachable.',
    arrangement: originalArrangement(76, [
      section('verse', 'Loop', ['C', 'G', 'Am', 'Fmaj7', 'C', 'G', 'Fmaj7', 'C']),
    ]),
  },
  {
    id: 'original-blue-hour',
    title: '12-Bar Blues in A',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '1:09',
    genre: 'Blues Practice',
    chords: ['A7', 'D7', 'E7'],
    key: 'A',
    note: 'A compact twelve-bar blues form. Listen for the move to D7 and the E7 turnaround back home.',
    arrangement: originalArrangement(84, [
      section('form', '12-bar form', ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7']),
    ], '↓ · ↓↑ · ↑'),
  },
  {
    id: 'original-suspended-sky',
    title: 'Anchored-Finger Loop in G',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '1:02',
    genre: 'Chord Technique',
    chords: ['Em7', 'Cadd9', 'G (320033)', 'Dsus4'],
    key: 'G',
    note: 'Keep ring and little fingers anchored on the top strings while the lower fingers move.',
    arrangement: originalArrangement(68, [
      section('a', 'A', ['Em7', 'Cadd9', 'G (320033)', 'Dsus4']),
      section('b', 'B', ['Em7', 'G (320033)', 'Cadd9', 'Dsus4']),
    ]),
  },
  {
    id: 'original-midnight-turn',
    title: 'i–v–VII–IV in D Minor',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '1:16',
    genre: 'Minor Practice',
    chords: ['Dm', 'Am', 'C', 'G'],
    key: 'Dm',
    note: 'A minor progression that makes Dm-to-Am repetition feel musical instead of mechanical.',
    arrangement: originalArrangement(70, [
      section('verse', 'Loop', ['Dm', 'Am', 'C', 'G', 'Dm', 'Am', 'G', 'G']),
      section('return', 'Variation', ['Dm', 'C', 'Am', 'G']),
    ]),
  },
  {
    id: 'original-barre-bridge',
    title: 'Four-Chord Barre Circuit',
    artist: 'Practice Exercise',
    difficulty: 'Hard',
    duration: '1:20',
    genre: 'Rock Practice',
    chords: ['F', 'Bb', 'Cm', 'Gm'],
    key: 'F',
    note: 'A deliberate barre workout. Loop one section and stop before hand fatigue turns into tension.',
    arrangement: originalArrangement(60, [
      section('verse', 'Low bridge', ['F', 'Cm', 'Bb', 'F']),
      section('chorus', 'High bridge', ['Gm', 'Bb', 'F', 'Cm']),
    ], '↓ · · ↓'),
  },
  {
    id: 'original-string-lanterns',
    title: 'Open-Position String Crossing',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:42',
    genre: 'Technique Riff',
    chords: ['Em', 'C'],
    key: 'Em',
    note: 'A first single-note tab line. Zero means an open string; let each note speak before moving on.',
    arrangement: {
      bpm: 60,
      beatsPerBar: 4,
      strumPattern: 'Single notes',
      license: 'CC0-1.0',
      sections: [{
        id: 'melody',
        label: 'String pattern',
        events: [
          { kind: 'note', stringIndex: 0, fret: 0, label: 'E0', beats: 1 },
          { kind: 'note', stringIndex: 0, fret: 3, label: 'E3', beats: 1 },
          { kind: 'note', stringIndex: 1, fret: 2, label: 'A2', beats: 1 },
          { kind: 'note', stringIndex: 1, fret: 3, label: 'A3', beats: 1 },
          { kind: 'note', stringIndex: 2, fret: 2, label: 'D2', beats: 1 },
          { kind: 'note', stringIndex: 1, fret: 3, label: 'A3', beats: 1 },
          { kind: 'note', stringIndex: 1, fret: 2, label: 'A2', beats: 1 },
          { kind: 'note', stringIndex: 0, fret: 0, label: 'E0', beats: 1 },
        ],
      }],
    },
  },
  {
    id: 'original-morning-steps',
    title: 'Two-String Finger Walk',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:32',
    genre: 'Technique Riff',
    chords: ['C', 'G'],
    key: 'C',
    note: 'A measured finger walk on two neighboring strings. Let the two-beat ending notes ring.',
    arrangement: originalArrangement(72, [{
      id: 'melody', label: 'Finger walk', events: [
        noteEvent(1, 3), noteEvent(2, 0), noteEvent(2, 2), noteEvent(2, 3),
        noteEvent(2, 2), noteEvent(2, 0), noteEvent(1, 3, 2),
        noteEvent(1, 0), noteEvent(1, 2), noteEvent(1, 3), noteEvent(2, 0),
        noteEvent(1, 3), noteEvent(1, 2), noteEvent(1, 0, 2),
      ],
    }], 'Single notes'),
  },
  {
    id: 'original-low-string-walk',
    title: 'Low E–A String Walk',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:28',
    genre: 'Technique Riff',
    chords: ['E', 'A'],
    key: 'E',
    note: 'A low-string riff for learning fret distance without a chord change getting in the way.',
    arrangement: originalArrangement(80, [{
      id: 'riff', label: 'Main riff', events: [
        noteEvent(0, 0), noteEvent(0, 3), noteEvent(1, 0), noteEvent(1, 2),
        noteEvent(1, 0), noteEvent(0, 3), noteEvent(0, 0, 2),
        noteEvent(0, 0), noteEvent(0, 2), noteEvent(0, 3), noteEvent(1, 0),
        noteEvent(0, 3), noteEvent(0, 2), noteEvent(0, 0, 2),
      ],
    }], 'Single notes'),
  },
  {
    id: 'original-high-string-echo',
    title: 'B–High E Finger Walk',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:30',
    genre: 'Technique Riff',
    chords: ['Em', 'G'],
    key: 'Em',
    note: 'A short mechanical finger pattern on the B and high-e strings with comfortable first-position frets.',
    arrangement: originalArrangement(76, [{
      id: 'call', label: 'Finger pattern', events: [
        noteEvent(4, 0), noteEvent(4, 1), noteEvent(4, 3, 2),
        noteEvent(5, 0), noteEvent(5, 3), noteEvent(5, 0, 2),
        noteEvent(4, 3), noteEvent(4, 1), noteEvent(4, 0, 2),
        noteEvent(5, 3), noteEvent(5, 2), noteEvent(5, 0, 2),
      ],
    }], 'Single notes'),
  },
  {
    id: 'original-cross-string-climb',
    title: '1–2 Cross-String Drill',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '0:36',
    genre: 'Technique Riff',
    chords: ['Am', 'C'],
    key: 'Am',
    note: 'Climb across four strings and return. Use alternate picking and keep unused strings quiet.',
    arrangement: originalArrangement(68, [{
      id: 'climb', label: 'Up and down', events: [
        noteEvent(1, 0), noteEvent(1, 2), noteEvent(2, 0), noteEvent(2, 2),
        noteEvent(3, 0), noteEvent(3, 2), noteEvent(4, 0), noteEvent(4, 1),
        noteEvent(4, 0), noteEvent(3, 2), noteEvent(3, 0), noteEvent(2, 2),
        noteEvent(2, 0), noteEvent(1, 2), noteEvent(1, 0, 2),
      ],
    }], 'Single notes'),
  },
  {
    id: 'original-porch-waltz',
    title: 'I–IV–I–V Waltz in G',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:48',
    genre: 'Chord Progression',
    chords: ['G', 'C', 'D'],
    key: 'G',
    note: 'Count ONE-two-three. Each diagram lasts one full three-beat bar.',
    arrangement: {
      bpm: 72, beatsPerBar: 3, strumPattern: '↓ ↓ ↓', license: 'CC0-1.0',
      sections: [{ id: 'waltz', label: 'Waltz', events: ['G', 'C', 'G', 'D', 'G', 'C', 'D', 'G'].map((name) => chordEvent(name, 3)) }],
    },
  },
  {
    id: 'original-seventh-street',
    title: 'Eight-Bar Blues in E',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '0:52',
    genre: 'Blues Practice',
    chords: ['E7', 'A7', 'B7'],
    key: 'E',
    note: 'A dominant-seventh blues loop with a clear B7 turnaround.',
    arrangement: originalArrangement(92, [
      section('form', 'Blues form', ['E7', 'E7', 'A7', 'E7', 'B7', 'A7', 'E7', 'B7']),
    ], '↓ · ↓ ↑'),
  },
  {
    id: 'original-major-seven-sunset',
    title: 'I–IV–vi–V Sevenths in C',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '0:56',
    genre: 'Chord Progression',
    chords: ['Cmaj7', 'Fmaj7', 'Am7', 'G7'],
    key: 'C',
    note: 'Relaxed seventh-chord changes that reward light fretting pressure and an even groove.',
    arrangement: originalArrangement(66, [
      section('a', 'A', ['Cmaj7', 'Fmaj7', 'Am7', 'G7', 'Cmaj7', 'Fmaj7', 'G7', 'Cmaj7']),
    ], '↓ · ↑ ·'),
  },
  {
    id: 'original-barre-summit',
    title: 'Barre Chord Cycle in F',
    artist: 'Practice Exercise',
    difficulty: 'Hard',
    duration: '1:04',
    genre: 'Barre Practice',
    chords: ['F', 'Gm', 'Bb', 'Cm'],
    key: 'F',
    note: 'A slow barre-chord circuit. Release pressure between changes without lifting the index far away.',
    arrangement: originalArrangement(56, [
      section('climb', 'Climb', ['F', 'Gm', 'Bb', 'Cm', 'Bb', 'Gm', 'F', 'F']),
    ], '↓ · · ·'),
  },
  {
    id: 'exercise-one-four-five-c',
    title: 'I–IV–V–I in C',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:27',
    genre: 'Chord Progression',
    chords: ['C', 'Fmaj7', 'G'],
    key: 'C',
    note: 'Hear tension and release: home, away, tension, then home. Use Fmaj7 until the full F barre is comfortable.',
    arrangement: originalArrangement(72, [
      section('loop', 'Common cadence', ['C', 'Fmaj7', 'G', 'C', 'C', 'Fmaj7', 'G', 'C']),
    ], '↓ ↓ ↓ ↓'),
  },
  {
    id: 'exercise-one-six-four-five-c',
    title: 'I–vi–IV–V in C',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:25',
    genre: 'Chord Progression',
    chords: ['C', 'Am', 'Fmaj7', 'G'],
    key: 'C',
    note: 'A widely used major-key cycle. Keep the first finger close when moving from Am to Fmaj7.',
    arrangement: originalArrangement(76, [
      section('loop', 'Common cycle', ['C', 'Am', 'Fmaj7', 'G', 'C', 'Am', 'Fmaj7', 'G']),
    ]),
  },
  {
    id: 'exercise-six-four-one-five-c',
    title: 'vi–IV–I–V in C',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:27',
    genre: 'Chord Progression',
    chords: ['Am', 'Fmaj7', 'C', 'G'],
    key: 'C',
    note: 'The same diatonic chord family with a minor start. Listen for how the starting chord changes the mood.',
    arrangement: originalArrangement(70, [
      section('loop', 'Minor-start cycle', ['Am', 'Fmaj7', 'C', 'G', 'Am', 'Fmaj7', 'C', 'G']),
    ]),
  },
  {
    id: 'exercise-two-five-one-c',
    title: 'ii–V–I in C',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '0:30',
    genre: 'Chord Progression',
    chords: ['Dm', 'G7', 'C'],
    key: 'C',
    note: 'A common functional cadence. Give the final C twice as long and listen for the strong arrival home.',
    arrangement: originalArrangement(65, [{
      id: 'cadence', label: 'Cadence', events: [
        chordEvent('Dm', 4), chordEvent('G7', 4), chordEvent('C', 8),
        chordEvent('Dm', 4), chordEvent('G7', 4), chordEvent('C', 8),
      ],
    }], '↓ · ↓ ↑'),
  },
  {
    id: 'exercise-andalusian-am',
    title: 'i–VII–VI–V in A Minor',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '0:25',
    genre: 'Chord Progression',
    chords: ['Am', 'G', 'F', 'E'],
    key: 'Am',
    note: 'A descending minor-key cadence. The full F barre makes this a useful bridge into intermediate playing.',
    arrangement: originalArrangement(76, [
      section('loop', 'Descending cadence', ['Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'E']),
    ], '↓ · ↓ ↑'),
  },
  {
    id: 'exercise-chromatic-1234',
    title: 'Chromatic 1–2–3–4',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:14',
    genre: 'Technique Riff',
    chords: ['E', 'A'],
    key: 'Chromatic',
    note: 'Assign one finger per fret. Keep every movement small and alternate the pick down-up.',
    arrangement: originalArrangement(70, [{
      id: 'ascending', label: '1–2–3–4', events: [
        noteEvent(0, 1), noteEvent(0, 2), noteEvent(0, 3), noteEvent(0, 4),
        noteEvent(1, 1), noteEvent(1, 2), noteEvent(1, 3), noteEvent(1, 4),
        noteEvent(1, 4), noteEvent(1, 3), noteEvent(1, 2), noteEvent(1, 1),
        noteEvent(0, 4), noteEvent(0, 3), noteEvent(0, 2), noteEvent(0, 1),
      ],
    }], 'Alternate picking'),
  },
  {
    id: 'exercise-am-pentatonic-fragment',
    title: 'A Minor Pentatonic Box Fragment',
    artist: 'Practice Exercise',
    difficulty: 'Medium',
    duration: '0:22',
    genre: 'Technique Riff',
    chords: ['Am', 'C'],
    key: 'Am',
    note: 'A scale fragment at fret 5. Practise one clean note at a time before increasing speed.',
    arrangement: originalArrangement(65, [{
      id: 'box', label: 'Box fragment', events: [
        noteEvent(0, 5), noteEvent(0, 8), noteEvent(1, 5), noteEvent(1, 7),
        noteEvent(2, 5), noteEvent(2, 7), noteEvent(3, 5), noteEvent(3, 7),
        noteEvent(4, 5), noteEvent(4, 8), noteEvent(5, 5), noteEvent(5, 8),
        noteEvent(5, 8), noteEvent(5, 5), noteEvent(4, 8), noteEvent(4, 5),
        noteEvent(3, 7), noteEvent(3, 5), noteEvent(2, 7), noteEvent(2, 5),
        noteEvent(1, 7), noteEvent(1, 5), noteEvent(0, 8), noteEvent(0, 5),
      ],
    }], 'Alternate picking'),
  },
  {
    id: 'exercise-open-string-ladder',
    title: 'Open-String Picking Ladder',
    artist: 'Practice Exercise',
    difficulty: 'Easy',
    duration: '0:10',
    genre: 'Technique Riff',
    chords: ['E', 'Em'],
    key: 'Open strings',
    note: 'Cross all six strings without fretting. Use slow alternate picking and mute strings after they sound.',
    arrangement: originalArrangement(72, [{
      id: 'ladder', label: 'Down and back', events: [
        noteEvent(0, 0), noteEvent(1, 0), noteEvent(2, 0), noteEvent(3, 0), noteEvent(4, 0), noteEvent(5, 0),
        noteEvent(5, 0), noteEvent(4, 0), noteEvent(3, 0), noteEvent(2, 0), noteEvent(1, 0), noteEvent(0, 0),
      ],
    }], 'Alternate picking'),
  },
];

export const SONG_REFERENCES: Song[] = [
  {
    id: '1',
    title: "Knockin' on Heaven's Door",
    artist: 'Bob Dylan',
    difficulty: 'Easy',
    duration: '2:33',
    genre: 'Folk',
    chords: ['G', 'D', 'Am', 'C'],
    key: 'G',
    note: 'Two bars per chord the whole way through. If you know four chords, you know this song.',
  },
  {
    id: '2',
    title: 'Horse with No Name',
    artist: 'America',
    difficulty: 'Easy',
    duration: '4:10',
    genre: 'Folk',
    chords: ['Em', 'D6/9/F#'],
    key: 'Em',
    note: 'Alternate Em with the two-finger D6/9/F# shape. Keep the strumming hand moving; a standard open D is not the recording’s second chord.',
  },
  {
    id: '3',
    title: 'Love Me Do',
    artist: 'The Beatles',
    difficulty: 'Easy',
    duration: '2:23',
    genre: 'Classic Rock',
    chords: ['G', 'C', 'D'],
    key: 'G',
    note: 'A straight G-C shuffle with a D in the middle eight. Good for a steady downstroke.',
  },
  {
    id: '4',
    title: 'Stand By Me',
    artist: 'Ben E. King',
    difficulty: 'Easy',
    duration: '2:58',
    genre: 'Pop',
    chords: ['A', 'F#m', 'D', 'E'],
    key: 'A',
    note: 'The classic I-vi-IV-V. F#m is your first barre chord in a real song.',
  },
  {
    id: '5',
    title: 'Riptide',
    artist: 'Vance Joy',
    difficulty: 'Easy',
    duration: '3:24',
    genre: 'Pop',
    chords: ['Am', 'G', 'C', 'F'],
    capo: 1,
    key: 'Am (with capo)',
    note: 'One four-chord loop nearly all the way through. F is the only hard shape - Fmaj7 works while you build up to the barre.',
  },
  {
    id: '6',
    title: 'Wonderwall',
    artist: 'Oasis',
    difficulty: 'Medium',
    duration: '4:18',
    genre: 'Classic Rock',
    chords: ['Em7', 'G (320033)', 'Dsus4', 'A7sus4', 'Cadd9'],
    capo: 2,
    key: 'Em (with capo)',
    note: 'Use the characteristic suspended/add9 shapes. Keep fingers 3 and 4 anchored at fret 3 on the B and high-e strings through the main changes.',
  },
  {
    id: '7',
    title: 'Wish You Were Here',
    artist: 'Pink Floyd',
    difficulty: 'Medium',
    duration: '5:34',
    genre: 'Classic Rock',
    chords: ['Em', 'G', 'A7', 'C', 'D', 'Am'],
    key: 'G',
    note: 'The intro is picked rather than strummed - worth learning slowly with a metronome.',
  },
  {
    id: '8',
    title: 'Let It Be',
    artist: 'The Beatles',
    difficulty: 'Medium',
    duration: '4:03',
    genre: 'Classic Rock',
    chords: ['C', 'G', 'Am', 'F'],
    key: 'C',
    note: 'Four chords, but the F catches people out. Try Fmaj7 until the barre is comfortable.',
  },
  {
    id: '9',
    title: 'Hotel California',
    artist: 'Eagles',
    difficulty: 'Medium',
    duration: '6:30',
    genre: 'Classic Rock',
    chords: ['Bm', 'F#', 'A', 'E', 'G', 'D', 'Em'],
    key: 'Bm',
    note: 'Two barre chords in the first two bars. Take the progression at half speed first.',
  },
  {
    id: '10',
    title: 'Hey Jude',
    artist: 'The Beatles',
    difficulty: 'Medium',
    duration: '7:11',
    genre: 'Classic Rock',
    chords: ['F', 'C', 'Bb', 'G'],
    key: 'F',
    note: 'Sits in F, so two of the four chords are barres. The long outro is one repeating loop.',
  },
  {
    id: '11',
    title: 'Nothing Else Matters',
    artist: 'Metallica',
    difficulty: 'Medium',
    duration: '6:28',
    genre: 'Classic Rock',
    chords: ['Em', 'D', 'C', 'G', 'Am', 'B7'],
    key: 'Em',
    note: 'Fingerpicked intro on open strings, then full chords. Start with the chord shapes alone.',
  },
  {
    id: '12',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    difficulty: 'Hard',
    duration: '8:02',
    genre: 'Classic Rock',
    chords: ['Am', 'C', 'D', 'F', 'G', 'Em'],
    key: 'Am',
    note: 'The famous intro is a descending line, not strummed chords. Learn the shapes first.',
  },
  {
    id: '13',
    title: 'Comfortably Numb',
    artist: 'Pink Floyd',
    difficulty: 'Hard',
    duration: '6:24',
    genre: 'Classic Rock',
    chords: ['Bm', 'A', 'G', 'Em', 'D', 'C'],
    key: 'Bm',
    note: 'Verse sits in B minor, chorus lifts to D major. The solos are the hard part.',
  },
  {
    id: '14',
    title: 'Free Bird',
    artist: 'Lynyrd Skynyrd',
    difficulty: 'Hard',
    duration: '9:08',
    genre: 'Classic Rock',
    chords: ['G', 'D', 'Em', 'F', 'C'],
    key: 'G',
    note: 'The slow half is very playable. The closing solo is a long-term project.',
  },
  {
    id: '15',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    difficulty: 'Hard',
    duration: '5:55',
    genre: 'Pop',
    chords: ['Bb', 'Gm', 'Cm', 'F', 'Eb'],
    key: 'Bb',
    note: 'Changes key several times. These are the ballad section chords - all barres.',
  },
];

/** Combined catalogue retained for saved IDs and callers that browse both. */
export const SONGS: Song[] = [...PRACTICE_EXERCISES, ...SONG_REFERENCES];

export function isPracticeExercise(song: Song): boolean {
  return PRACTICE_EXERCISES.some((exercise) => exercise.id === song.id);
}

export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}
