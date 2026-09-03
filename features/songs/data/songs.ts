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

const originalArrangement = (
  bpm: number,
  sections: SongSection[],
  strumPattern = '↓ ↓ ↑ ↑ ↓ ↑',
): SongArrangement => ({ bpm, beatsPerBar: 4, strumPattern, sections, license: 'CC0-1.0' });

export const SONGS: Song[] = [
  // Complete, original practice arrangements. These are deliberately kept
  // separate in authorship from the song references below: chord progressions
  // are reusable musical building blocks, but copyrighted lyrics, melodies,
  // tabs and recording-specific arrangements are not bundled.
  {
    id: 'original-first-light',
    title: 'First Light',
    artist: 'StandardTune Studio',
    difficulty: 'Easy',
    duration: '1:04',
    genre: 'Pop Practice',
    chords: ['G', 'D', 'Em', 'C'],
    key: 'G',
    note: 'A forgiving four-chord first song. Keep fingers close to the strings and let the app wait while each shape settles.',
    arrangement: originalArrangement(72, [
      section('verse', 'Verse', ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'C']),
      section('chorus', 'Chorus', ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G']),
    ]),
  },
  {
    id: 'original-two-chord-train',
    title: 'Two-Chord Train',
    artist: 'StandardTune Studio',
    difficulty: 'Easy',
    duration: '0:48',
    genre: 'Groove Practice',
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
    title: 'Open Road',
    artist: 'StandardTune Studio',
    difficulty: 'Easy',
    duration: '0:58',
    genre: 'Rock Practice',
    chords: ['A', 'D', 'E'],
    key: 'A',
    note: 'Three open major chords with long bars. Aim for relaxed, even downstrokes before adding the upstrokes.',
    arrangement: originalArrangement(88, [
      section('verse', 'Verse', ['A', 'D', 'A', 'E', 'A', 'D', 'E', 'A']),
    ], '↓ ↓ ↓ ↓'),
  },
  {
    id: 'original-rainy-window',
    title: 'Rainy Window',
    artist: 'StandardTune Studio',
    difficulty: 'Easy',
    duration: '1:12',
    genre: 'Folk Practice',
    chords: ['Am', 'C', 'G', 'Em'],
    key: 'Am',
    note: 'A quiet minor-key loop for smooth changes. Let common fingers stay planted whenever possible.',
    arrangement: originalArrangement(64, [
      section('verse', 'Verse', ['Am', 'C', 'G', 'Em', 'Am', 'C', 'Em', 'Em']),
      section('lift', 'Lift', ['C', 'G', 'Am', 'Em']),
    ]),
  },
  {
    id: 'original-campfire-circle',
    title: 'Campfire Circle',
    artist: 'StandardTune Studio',
    difficulty: 'Easy',
    duration: '0:54',
    genre: 'Folk Practice',
    chords: ['C', 'G', 'Am', 'Fmaj7'],
    key: 'C',
    note: 'Uses beginner-friendly Fmaj7 instead of a full F barre, making the classic four-chord family approachable.',
    arrangement: originalArrangement(76, [
      section('verse', 'Verse', ['C', 'G', 'Am', 'Fmaj7', 'C', 'G', 'Fmaj7', 'C']),
    ]),
  },
  {
    id: 'original-blue-hour',
    title: 'Blue Hour',
    artist: 'StandardTune Studio',
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
    title: 'Suspended Sky',
    artist: 'StandardTune Studio',
    difficulty: 'Medium',
    duration: '1:02',
    genre: 'Ambient Practice',
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
    title: 'Midnight Turn',
    artist: 'StandardTune Studio',
    difficulty: 'Medium',
    duration: '1:16',
    genre: 'Minor Practice',
    chords: ['Dm', 'Am', 'C', 'G'],
    key: 'Dm',
    note: 'A minor progression that makes Dm-to-Am repetition feel musical instead of mechanical.',
    arrangement: originalArrangement(70, [
      section('verse', 'Verse', ['Dm', 'Am', 'C', 'G', 'Dm', 'Am', 'G', 'G']),
      section('return', 'Return', ['Dm', 'C', 'Am', 'G']),
    ]),
  },
  {
    id: 'original-barre-bridge',
    title: 'Barre Bridge',
    artist: 'StandardTune Studio',
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
    title: 'String Lanterns',
    artist: 'StandardTune Studio',
    difficulty: 'Easy',
    duration: '0:42',
    genre: 'Tab Practice',
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
        label: 'Melody',
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

export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}
