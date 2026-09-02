import { findBarres } from './barres';
import { Chord } from './chords';

export const GUITAR_STRING_NAMES = [
  'low E (6th string)',
  'A (5th string)',
  'D (4th string)',
  'G (3rd string)',
  'B (2nd string)',
  'high e (1st string)',
] as const;

export const FRETTING_FINGER_NAMES = {
  1: 'index',
  2: 'middle',
  3: 'ring',
  4: 'little finger',
} as const;

export function frettingFingerName(finger: number): string {
  return FRETTING_FINGER_NAMES[finger as keyof typeof FRETTING_FINGER_NAMES] ?? 'finger';
}

/**
 * A screen-reader-friendly equivalent of the visual chord box.
 * Chord data always stays low-E to high-e; only its displayed direction changes.
 */
export function describeChordDiagram(chord: Chord, leftHanded: boolean): string {
  const direction = leftHanded
    ? 'Strings are shown high e to low E from left to right for left-handed view.'
    : 'Strings are shown low E to high e from left to right.';
  const barres = findBarres(chord);
  const barred = new Set<number>();
  const instructions: string[] = [];

  for (const barre of barres) {
    for (let i = barre.from; i <= barre.to; i += 1) {
      if (chord.strings[i] === barre.fret && chord.fingers[i] === barre.finger) {
        barred.add(i);
      }
    }
    instructions.push(
      `Barre fret ${barre.fret} from ${GUITAR_STRING_NAMES[barre.from]} through ${GUITAR_STRING_NAMES[barre.to]} with finger ${barre.finger}, ${frettingFingerName(barre.finger)}`,
    );
  }

  chord.strings.forEach((fret, stringIndex) => {
    if (fret < 0) {
      instructions.push(`${GUITAR_STRING_NAMES[stringIndex]} muted`);
    } else if (fret === 0) {
      instructions.push(`${GUITAR_STRING_NAMES[stringIndex]} open`);
    } else if (!barred.has(stringIndex)) {
      const finger = chord.fingers[stringIndex];
      instructions.push(
        `${GUITAR_STRING_NAMES[stringIndex]} fret ${fret} with finger ${finger}, ${frettingFingerName(finger)}`,
      );
    }
  });

  return `${chord.name} chord diagram. ${direction} ${instructions.join('. ')}.`;
}

export interface ChordDiagramQuizQuestion {
  id: string;
  prompt: string;
  chordName: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const CHORD_DIAGRAM_QUIZ: ChordDiagramQuizQuestion[] = [
  {
    id: 'em-fret',
    prompt: 'Both numbered dots in this Em shape sit in which fret?',
    chordName: 'Em',
    options: ['1st fret', '2nd fret', '3rd fret'],
    correctIndex: 1,
    explanation: 'Right: both dots sit between the fret lines labelled 2.',
  },
  {
    id: 'a-muted',
    prompt: 'What does the × above the low E string tell you?',
    chordName: 'A',
    options: ['Press it', 'Play it open', 'Keep it silent'],
    correctIndex: 2,
    explanation: 'Right: × means do not let that string sound. Start this strum on the A string.',
  },
  {
    id: 'c-open',
    prompt: 'What does an open circle ○ above a string mean?',
    chordName: 'C',
    options: ['Let it ring open', 'Mute it', 'Press the nut'],
    correctIndex: 0,
    explanation: 'Right: play that string without pressing any fret.',
  },
  {
    id: 'finger-one',
    prompt: 'The dot marked 1 asks for which fretting finger?',
    chordName: 'C',
    options: ['Thumb', 'Index', 'Middle'],
    correctIndex: 1,
    explanation: 'Right: 1 is index. Then 2 is middle, 3 ring, and 4 little finger.',
  },
  {
    id: 'f-barre',
    prompt: 'What does the long green bar in this F shape mean?',
    chordName: 'F',
    options: ['Strum quickly', 'One finger holds several strings', 'Slide between frets'],
    correctIndex: 1,
    explanation: 'Right: flatten the numbered finger across every string covered by the bar.',
  },
];
