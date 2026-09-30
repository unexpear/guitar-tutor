import { Target, DetectionMode } from '../playalong/matcher';
import { UKULELE_C_MIDI, UKULELE_G7_MIDI, type PracticeInstrument } from './practicePitch';

export interface Drill {
  /** Omitted means the existing standard six-string guitar practice. */
  instrument?: 'bass' | PracticeInstrument;
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
  'acoustic-pick-pulse': {
    lessonId: 'acoustic-pick-pulse', title: 'Em, One String at a Time',
    intro: 'Hold Em. The four downstrokes are your own count. This drill checks each sounding string once, because a ringing chord would satisfy the next identical target.',
    targets: [note(0, 0, 'low E'), note(1, 2, 'A fret 2'), note(2, 2, 'D fret 2'), note(3, 0, 'G'), note(4, 0, 'B'), note(5, 0, 'high e')],
    defaultMode: 'mono', secondsPerTarget: 8,
  },
  'acoustic-three-chord-loop': {
    lessonId: 'acoustic-three-chord-loop', title: 'G C D Loop',
    intro: 'Form each open chord, then one pick downstroke per target. This is an original practice loop, not a song arrangement.',
    targets: [chord('G'), chord('C'), chord('D'), chord('G'), chord('C'), chord('D'), chord('G')],
    defaultMode: 'poly', secondsPerTarget: 10,
  },
  'electric-fret-mute': {
    lessonId: 'electric-fret-mute', title: 'Root and Fifth, Neighbours Quiet',
    intro: 'Play each labeled note alone. Keep unused strings quiet with the fretting hand. The app hears pitch, not mute quality.',
    targets: [note(0, 3, 'G root'), note(1, 5, 'D fifth'), note(0, 5, 'A root'), note(1, 7, 'E fifth'), note(0, 3, 'G root again')],
    defaultMode: 'mono', secondsPerTarget: 8,
  },
  'electric-palm-mute': {
    lessonId: 'electric-palm-mute', title: 'Short Then Ringing',
    intro: 'Same root-and-fifth frets. Try a short palm-muted attack, then a ringing one. Pitch detection cannot score mute depth.',
    targets: [note(0, 3, 'G root'), note(1, 5, 'D fifth'), note(0, 5, 'A root'), note(1, 7, 'E fifth')],
    defaultMode: 'mono', secondsPerTarget: 8,
  },
  'classical-rest-stroke': {
    lessonId: 'classical-rest-stroke', title: 'Open Treble Rest Stroke',
    intro: 'Pluck each open treble string and land on the next thicker string. The app checks pitch, not which finger you used.',
    targets: [note(3, 0, 'G open'), note(4, 0, 'B open'), note(5, 0, 'e open'), note(4, 0, 'B again'), note(3, 0, 'G again')],
    defaultMode: 'mono', secondsPerTarget: 8,
  },
  'classical-treble-melody': {
    lessonId: 'classical-treble-melody', title: 'Terrace Phrase',
    intro: 'An original eight-note phrase on G, B and high e, frets 0–3. Not a folk tune. Follow Me waits.',
    targets: [note(3, 0, 'G open'), note(3, 2, 'G fret 2'), note(4, 0, 'B open'), note(4, 1, 'B fret 1'), note(5, 0, 'e open'), note(5, 3, 'e fret 3'), note(4, 0, 'B return'), note(3, 0, 'G return')],
    defaultMode: 'mono', secondsPerTarget: 8,
  },
  'uke-two-chord-strum': {
    lessonId: 'uke-two-chord-strum',
    title: 'Ukulele C and G7',
    instrument: 'ukulele',
    intro: 'Strum high-G ukulele C, then G7. The check listens for those sounding pitches. It does not judge strum size or whether you used a guitar shape.',
    targets: [
      { kind: 'chord', chordName: 'Ukulele C', label: 'C', soundingMidi: UKULELE_C_MIDI },
      { kind: 'chord', chordName: 'Ukulele G7', label: 'G7', soundingMidi: UKULELE_G7_MIDI },
      { kind: 'chord', chordName: 'Ukulele C', label: 'C again', soundingMidi: UKULELE_C_MIDI },
      { kind: 'chord', chordName: 'Ukulele G7', label: 'G7 again', soundingMidi: UKULELE_G7_MIDI },
    ],
    defaultMode: 'poly',
    secondsPerTarget: 8,
  },
  'uke-open-pluck': {
    lessonId: 'uke-open-pluck',
    title: 'Open G C E A',
    instrument: 'ukulele',
    intro: 'Pluck the open ukulele strings in this order. Pitch only. High G is the string nearest you, not a low guitar string.',
    targets: [note(0, 0, 'G'), note(1, 0, 'C'), note(2, 0, 'E'), note(3, 0, 'A'), note(2, 0, 'E return'), note(1, 0, 'C return'), note(0, 0, 'G return'), note(3, 0, 'A end')],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'mandolin-clean-course': {
    lessonId: 'mandolin-clean-course',
    title: 'Open G and D courses',
    instrument: 'mandolin',
    intro: 'One pitch stands for both strings of a course. The check cannot tell whether you struck one string or the pair. Listen for the pair yourself.',
    targets: [note(0, 0, 'G course'), note(1, 0, 'D course'), note(0, 0, 'G again'), note(1, 0, 'D again')],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'mandolin-open-fifth': {
    lessonId: 'mandolin-open-fifth',
    title: 'G to D, then a fret',
    instrument: 'mandolin',
    intro: 'Open G then open D is a fifth. Then fret the D course at fret 2. Guitar fourths shapes are the wrong map.',
    targets: [note(0, 0, 'G'), note(1, 0, 'D'), note(1, 2, 'D fret 2'), note(2, 0, 'A')],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'banjo-eight-forward': {
    lessonId: 'banjo-eight-forward',
    title: 'Eight open pitches',
    instrument: 'banjo',
    intro: 'These are the pitches of an original slow roll. The check hears pitch only. It does not know whether you used thumb, index, or middle, and it is not clawhammer.',
    targets: [note(1, 0, 'D'), note(2, 0, 'G'), note(3, 0, 'B'), note(4, 0, 'd'), note(2, 0, 'G again'), note(3, 0, 'B again'), note(0, 0, 'short g'), note(4, 0, 'd end')],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'violin-bow-open': {
    lessonId: 'violin-bow-open',
    title: 'Open A and D',
    instrument: 'violin',
    intro: 'Bow open A, then open D. A sustained bow on one pitch cannot be scored as four separate quarters, so those repeats stay in your own count. Bow direction is not graded.',
    targets: [note(2, 0, 'A'), note(1, 0, 'D'), note(2, 0, 'A again'), note(3, 0, 'E')],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'violin-open-listen': {
    lessonId: 'violin-open-listen',
    title: 'In-tune open strings',
    instrument: 'violin',
    intro: 'Play each open string close enough for the pitch check. The tuner screen still shows sharp or flat. This does not grade fingered notes or the bow.',
    targets: [note(0, 0, 'G'), note(1, 0, 'D'), note(2, 0, 'A'), note(3, 0, 'E')],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'viola-bow-open-cg': {
    lessonId: 'viola-bow-open-cg',
    title: 'Open C and G',
    instrument: 'viola',
    intro: 'Bow open C, then open G. Pitch only. Bow direction and tone are for you to judge. These are not violin strings.',
    targets: [note(0, 0, 'C'), note(1, 0, 'G'), note(0, 0, 'C again'), note(2, 0, 'D')],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'cello-bow-open-gd': {
    lessonId: 'cello-bow-open-gd',
    title: 'Open G and D',
    instrument: 'cello',
    intro: 'Bow open G, then open D, with separate bows. The check hears pitch. It does not grade the bow hold or thumb position.',
    targets: [note(1, 0, 'G'), note(2, 0, 'D'), note(1, 0, 'G again'), note(0, 0, 'C')],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
  'beginner-two-chords': {
    lessonId: 'beginner-two-chords', title: 'Em and Am, Slowly',
    intro: 'Form Em, then Am, with no countdown in Follow Me. Check each string yourself too: chord-tone evidence is useful feedback, not proof of fingering or every string.',
    targets: [chord('Em'), chord('Am'), chord('Em'), chord('Am')], defaultMode: 'poly', secondsPerTarget: 12,
  },
  'classical-first-touch': {
    lessonId: 'classical-first-touch', title: 'Open Treble Strings',
    intro: 'Alternate i and m on open G, B and high e. Play gently and evenly. The app checks the sounding pitch, not which finger you use.',
    targets: [note(3, 0, 'G open'), note(4, 0, 'B open'), note(5, 0, 'e open'), note(4, 0, 'B open'), note(3, 0, 'G open')], defaultMode: 'mono', secondsPerTarget: 8,
  },
  'classical-reading-music': {
    lessonId: 'classical-reading-music', title: 'Name the Treble Notes',
    intro: 'Name the written note before playing the open string. Written G4, B4 and E5 sound as G3, B3 and E4 on guitar. This drill checks pitch, not sight-reading fluency.',
    targets: [note(3, 0, 'G: written G4'), note(5, 0, 'e: written E5'), note(4, 0, 'B: written B4'), note(3, 0, 'G: written G4')], defaultMode: 'mono', secondsPerTarget: 8,
  },
  'beginner-fretting-notes': {
    lessonId: 'beginner-fretting-notes',
    title: 'One Note at a Time',
    intro:
      'One note per target on the two thickest strings. Listen for a clear sound and use light pressure. A pitch match cannot judge buzz or hand position, and a missed reading can also come from room noise or the microphone. Follow Me waits for you.',
    targets: [
      note(0, 0, 'E open'),
      note(0, 1, 'E fret 1'),
      note(0, 3, 'E fret 3'),
      note(1, 0, 'A open'),
      note(1, 2, 'A fret 2'),
      note(1, 3, 'A fret 3'),
      note(0, 0, 'E open'),
      note(1, 2, 'A fret 2'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 8,
  },
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
      note(3, 2, 'G2'),
      note(4, 0, 'B0'),
      note(4, 3, 'B3'),
      note(5, 0, 'e0'),
      note(5, 3, 'e3'),
      note(5, 0, 'e0'),
      note(4, 3, 'B3'),
      note(4, 0, 'B0'),
      note(3, 2, 'G2'),
      note(3, 0, 'G0'),
      note(2, 2, 'D2'),
      note(2, 0, 'D0'),
      note(1, 2, 'A2'),
      note(1, 0, 'A0'),
      note(0, 3, 'E3'),
      note(0, 0, 'E0'),
    ],
    defaultMode: 'mono',
    secondsPerTarget: 4,
  },
  'beginner-open-chords': {
    lessonId: 'beginner-open-chords',
    title: 'Chord Changes',
    intro:
      'Form each chord with the diagram and strum once. Full chord mode looks for several chord tones, but cannot prove that every string or finger is correct. Easy mode accepts a single chord tone. Listen string by string as well, and begin with the two-chord lesson if these changes feel too big.',
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
    defaultMode: 'poly',
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
      'Full chord mode looks for several chord tones. Check the intended strings one by one and release your hand between attempts. If a match fails, check tuning and the sound reaching the microphone too; the app cannot inspect your barre or prove every string is ringing.',
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
      'The position from the lesson: A string 3-5-7, D string 3-5-7, G string 4-5. Shift the hand comfortably to reach fret 7 rather than forcing a stretch. Say each note name aloud, then run it back down.',
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
      'Every chord in the key of G, in order: G, Am, Bm, C, D, Em, F#dim. Listen to how the diminished seventh-degree chord creates tension that wants to return to G.',
    targets: [
      chord('G'),
      chord('Am'),
      chord('Bm'),
      chord('C'),
      chord('D'),
      chord('Em'),
      chord('F#dim'),
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
      note(5, 5, 'A'),
      note(4, 8, 'G'),
      note(4, 5, 'E'),
      note(3, 7, 'D'),
      note(3, 5, 'C'),
      note(2, 7, 'A'),
      note(2, 5, 'G'),
      note(1, 7, 'E'),
      note(1, 5, 'D'),
      note(0, 8, 'C'),
      note(0, 5, 'A'),
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
      note(0, 5, 'E5'),
      note(1, 5, 'A5'),
      note(1, 7, 'A7'),
      note(1, 5, 'A5'),
      note(2, 5, 'D5'),
      note(2, 7, 'D7'),
      note(2, 5, 'D5'),
      note(3, 5, 'G5'),
      note(3, 7, 'G7'),
      note(3, 5, 'G5'),
      note(4, 5, 'B5'),
      note(4, 7, 'B7'),
      note(4, 5, 'B5'),
      note(5, 5, 'e5'),
      note(5, 7, 'e7'),
      note(5, 5, 'e5'),
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

export const BASS_OPEN_MIDI = [28, 33, 38, 43] as const; // E1 A1 D2 G2
const bassDrill = (lessonId: string, title: string, targets: Target[]): Drill => ({
  lessonId, title, instrument: 'bass', targets, defaultMode: 'mono', secondsPerTarget: 8,
  intro: 'Standard four-string bass: E1-A1-D2-G2. Read the four-line tab, pluck one note and mute unused strings. Follow Me waits for you. Low bass detection depends on the phone and room; a missed match is not proof of bad fingering.',
});
Object.assign(DRILLS, {
  'bass-first-notes': bassDrill('bass-first-notes', 'Four Open Bass Strings', [note(0, 0, 'E open'), note(1, 0, 'A open'), note(2, 0, 'D open'), note(3, 0, 'G open')]),
  'bass-right-hand': bassDrill('bass-right-hand', 'Alternate and Change Strings', [note(0, 0, 'E · i'), note(1, 0, 'A · m'), note(0, 0, 'E · i'), note(1, 0, 'A · m')]),
  'bass-clean-notes': bassDrill('bass-clean-notes', 'Clear Low Bass Notes', [note(0, 0, 'E'), note(0, 1, 'F'), note(0, 3, 'G'), note(1, 0, 'A'), note(1, 2, 'B'), note(1, 3, 'C')]),
  'bass-reading-tabs': bassDrill('bass-reading-tabs', 'Read Four Lines', [note(0, 0, 'E open'), note(0, 3, 'E fret 3'), note(1, 0, 'A open'), note(1, 2, 'A fret 2'), note(2, 0, 'D open'), note(3, 0, 'G open')]),
  'bass-fretboard': bassDrill('bass-fretboard', 'Find Bass Octaves', [note(0, 0, 'E1'), note(2, 2, 'E2'), note(1, 0, 'A1'), note(3, 2, 'A2')]),
  'bass-roots-fifths': bassDrill('bass-roots-fifths', 'Root and Fifth', [note(0, 3, 'G root'), note(1, 5, 'D fifth'), note(0, 3, 'G root'), note(0, 5, 'A root'), note(1, 7, 'E fifth'), note(0, 5, 'A root')]),
  'bass-quarter-roots': bassDrill('bass-quarter-roots', 'G, C, D, G', [note(0, 3, 'G'), note(1, 3, 'C'), note(1, 5, 'D'), note(0, 3, 'G')]),
  'bass-box-shapes': bassDrill('bass-box-shapes', 'Two Bass Boxes', [note(0, 3, 'G root'), note(1, 5, 'D fifth'), note(2, 5, 'G octave'), note(0, 3, 'G return'), note(1, 3, 'C root'), note(2, 5, 'G fifth'), note(3, 5, 'C octave'), note(1, 3, 'C return')]),
  'bass-fingers-hearing': bassDrill('bass-fingers-hearing', 'Open E and A, Soft Attack', [note(0, 0, 'E open'), note(1, 0, 'A open'), note(0, 0, 'E again'), note(1, 0, 'A again')]),
  'bass-roots-form-a': bassDrill('bass-roots-form-a', 'Roots in A', [note(1, 0, 'A bar 1'), note(0, 0, 'E bar 2'), note(1, 0, 'A bar 3'), note(0, 0, 'E bar 4'), note(1, 5, 'D bar 5'), note(1, 0, 'A bar 6'), note(0, 0, 'E bar 7'), note(1, 0, 'A bar 8'), note(0, 0, 'E bar 10'), note(1, 5, 'D bar 11'), note(1, 0, 'A bar 12')]),
});

export function getDrill(lessonId: string): Drill | undefined {
  return DRILLS[lessonId];
}
