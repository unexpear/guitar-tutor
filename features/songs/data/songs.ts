export type Difficulty = 'Easy' | 'Medium' | 'Hard';

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
}

export const SONGS: Song[] = [
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
    chords: ['Em', 'D'],
    key: 'Em',
    note: 'Only two chords, back and forth. The best first song for practising a clean change.',
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
    chords: ['Em', 'G', 'D', 'A7', 'C'],
    capo: 2,
    key: 'Em (with capo)',
    note: 'Keep your third and fourth fingers down on the top two strings through every change.',
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
