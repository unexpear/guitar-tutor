import { LEGACY_LESSON_DATA, type Difficulty, type Lesson, type LessonCategory } from './lessonCatalog';
import type { LearningInstrument } from './learningInstrument';

export interface GuidedLesson extends Lesson {
  minutes: number;
  outcome: string;
  practice: string;
  readyWhen: string;
}
type Coaching = [minutes: number, outcome: string, practice: string, readyWhen: string];
const coaching: Record<string, Coaching> = {
  'beginner-holding-the-guitar': [4, 'Support the instrument without gripping the neck.', 'Settle the instrument, release your fretting hand, then gently play an open string.', 'The instrument stays balanced and your shoulders and hands feel relaxed.'],
  'beginner-tuning-up': [5, 'Identify and tune the six standard strings.', 'Use Tune for this path, choose each string and make small adjustments. Check all six again.', 'You can name the string you pluck and explain whether its pitch needs to rise or fall.'],
  'beginner-guitar-anatomy': [4, 'Find the parts used in the next lessons.', 'Explore the labeled parts, then try the anatomy quiz.', 'You can locate a fret, the nut, the bridge and a tuning machine.'],
  'beginner-reading-diagrams': [5, 'Translate a diagram into a finger placement.', 'Read the string labels first. Explain an open circle, a mute mark and a finger number, then try the quiz.', 'You can find the string and fret for each dot without guessing.'],
  'beginner-fretting-notes': [5, 'Play one clear fretted note with light pressure.', 'Play the slow single-note drill. Listen for a clean start and release your hand between attempts.', 'You can repeat a clear note comfortably; the app score does not judge your hand position.'],
  'beginner-reading-tabs': [5, 'Read a fret number on the correct string.', 'Say the string and fret before each note in the First Notes drill.', 'You can distinguish an open string (0) from a fretted note and follow several targets in order.'],
  'beginner-open-chords': [7, 'Add one new chord at a time to Em and Am.', 'Choose D first, check its strings individually, then return to a familiar chord. Add G and C on later sessions.', 'Two chosen shapes ring clearly and you can change between them slowly. All five need not be fluent today.'],
  'beginner-basic-strumming': [6, 'Keep a pulse through a chord change.', 'Begin with one comfortable chord and four downstrokes per bar. Try the click drill when ready.', 'You can play four relaxed bars; if changes interrupt the pulse, slow down or return to one chord.'],
  'intermediate-barre-chords': [6, 'Understand movable chord shapes without forcing your hand.', 'Build a small comfortable barre first, release it, then try a movable shape. Take frequent breaks.', 'The notes you intend to play are clear and your hand is comfortable. Speed is not the goal.'],
  'intermediate-fingerpicking': [6, 'Separate a bass note from treble-string plucks.', 'Play the p-i-m-a-m-i drill slowly. Keep the thumb and fingers small and relaxed.', 'You can repeat the pattern with even volume and no extra string noise.'],
  'intermediate-scales-101': [6, 'Connect a scale pattern to note names.', 'Say C D E F G A B C while playing the one-octave drill. Shift your hand instead of stretching.', 'You can ascend and descend slowly and locate the two C notes.'],
  'intermediate-music-theory': [6, 'Hear roots, thirds and fifths as musical relationships.', 'Name the root of a familiar chord. Compare major and minor, then explore the G-family drill.', 'You can explain a root and a third; one detected chord tone is not proof of a whole chord.'],
  'advanced-improvisation': [7, 'Build short phrases with space between them.', 'Learn a small part of the pentatonic drill, then answer a three-note idea using the same notes.', 'You can repeat an idea and vary it deliberately, not just run a scale faster.'],
  'advanced-techniques': [6, 'Explore articulation while keeping the pitch controlled.', 'Choose one technique only. Try the 5h7p5 drill slowly and compare the volume of each note.', 'The notes sound intentionally and comfortably. A pitch match cannot certify the technique used.'],
  'advanced-songwriting': [8, 'Arrange a short musical idea yourself.', 'Choose a familiar progression, hum a short phrase, repeat it, then change one thing.', 'You have a short beginning, contrast and ending that you can repeat. The app does not generate a song.'],
  'bass-first-notes': [5, 'Set up and tune a standard four-string bass.', 'Choose E1-A1-D2-G2 in the tuner, then try the open-string drill. Keep amplifier volume comfortable.', 'You can identify each string and hear one clear note at a time.'],
  'bass-right-hand': [5, 'Alternate plucking fingers and quiet unused strings.', 'Alternate index and middle slowly. In the drill, release each note before changing strings.', 'Your two fingers sound reasonably even and you hear silence when you deliberately stop a note.'],
  'bass-fretboard': [6, 'Find roots and octaves in one small area.', 'Play E at open E and D-string fret 2; play A at open A and G-string fret 2.', 'You can locate those two octave pairs and distinguish a note name from its octave.'],
  'bass-groove': [6, 'Control when notes start and stop.', 'At 60 BPM, play one bar each of E and A. Next, leave beat two silent while counting it.', 'You can keep counting through a rest. The pitch drill is not an automatic test of silence or groove.'],
};

const added = (id: string, title: string, description: string, guide: Coaching): GuidedLesson => ({
  id, title, description, difficulty: 'beginner', minutes: guide[0], outcome: guide[1], practice: guide[2], readyWhen: guide[3],
});
const newLessons = [
  added('music-pulse', 'Pulse, Beats & Rests', 'Count a steady beat before adding more notes.', [5, 'Separate a steady pulse from the rhythm you play.', 'Tap four beats at 60 BPM. Play or tap on 1 and 3, leaving 2 and 4 silent. Count all four.', 'You can keep counting when your hands are silent.']),
  added('music-listening', 'Listen, Repeat & Compare', 'Train your ear with a few notes on your own instrument.', [5, 'Hear whether the next note is higher, lower or the same.', 'On one string, play fret 0 then 2, then reverse them. Hum or describe the change. Repeat a short three-note pattern.', 'You can hear the direction and repeat a simple idea; singing perfectly is not required.']),
  added('music-practice', 'Your First Practice Routine', 'Mix a small challenge with music you enjoy.', [8, 'Build a repeatable session and choose a useful next step.', 'Tune; review one comfortable skill for two minutes; work on one small challenge for three; finish with a familiar pattern for two.', 'You can name one thing that improved and one thing to repeat next time.']),
  added('beginner-two-chords', 'Your First Two Chords', 'Begin with Em and Am, not a whole page of shapes.', [6, 'Form Em and Am and change slowly between them.', 'Read each diagram, pluck its strings separately, then use Follow Me for the two-chord drill.', 'You can make each shape comfortably and change without a countdown.']),
  added('electric-setup', 'Clean Electric Sound', 'Set up a clear sound and control extra noise.', [5, 'Hear the notes you play through a clean amplifier sound.', 'Start with low volume and distortion off. Compare one ringing string with all strings gently muted.', 'A single note is clear and you can stop unwanted ringing without squeezing.']),
  added('electric-power-chords', 'Two-Note Power Shapes', 'Move a root and fifth while keeping other strings quiet.', [6, 'Play a two-string shape and understand its root.', 'Play low-E fret 3 and A fret 5 together. Mute the other strings. Move the shape to frets 5 and 7.', 'The two intended notes sound and unused strings stay quiet; this is a self-listening task.']),
  added('classical-posture', 'Classical Setup & Balance', 'Support the guitar and free both hands.', [4, 'Find a balanced position for nylon-string playing.', 'Use a stable chair and a suitable support or footstool if available. Raise the neck and check that the fretting hand is not supporting it.', 'Your shoulders are relaxed, the instrument stays stable and neither wrist is forced.']),
  added('classical-first-touch', 'First Fingerstyle Notes', 'Start with open treble strings and small finger movements.', [5, 'Use i and m to pluck without a pick.', 'Play open G, B and high e with alternating index and middle fingers. Start with a gentle free stroke.', 'Several notes have even tone and your fingers can move without a tense hand.']),
  added('classical-reading-music', 'First Notes on the Staff', 'Link G, B and high e to written notes.', [6, 'Understand the difference between a staff note and a tab fret number.', 'Use the note guide to find the three open treble strings. Play and name each slowly, then try the drill.', 'You can match the three written notes to their strings; full sight-reading comes through gradual practice.']),
  added('bass-reading-tabs', 'Reading Four-String Bass Tab', 'Use four lines and fret numbers, not guitar chord boxes.', [5, 'Read E-A-D-G bass tab in the right direction.', 'Find the bottom E line and top G line. Say the string and fret before playing the drill.', 'You can find open strings and frets 1–3 on the correct string.']),
  added('bass-clean-notes', 'Fretting & Releasing Bass Notes', 'Make clear notes without a wide finger stretch.', [5, 'Fret near the wire and release a note deliberately.', 'Play open E, F at fret 1 and G at fret 3. Move the hand between positions instead of forcing one finger per fret.', 'You can start and stop each note cleanly without discomfort.']),
  added('bass-roots-fifths', 'Roots, Fifths & Simple Bass Lines', 'Choose a supporting note instead of strumming a guitar shape.', [6, 'Find a root and its fifth on bass.', 'Play G at E-string fret 3, then D at A-string fret 5. Shift to A at E fret 5 and E at A fret 7.', 'You can name each root and fifth and return to the root on beat one.']),
  added('bass-reading-music', 'Bass Clef & Note Lengths', 'Connect bass staff notes to your strings and the beat.', [6, 'Recognize the bass clef and the written open-string notes.', 'Compare the note guide with E-A-D-G on your instrument. Count four quarter notes, two half notes, then a whole note in 4/4.', 'You understand that vertical position gives pitch while note shape and meter give duration.']),
  added('bass-quarter-roots', 'One Root per Bar', 'Support G, C and D with a single bass note.', [6, 'Place the root on beat one and let it last the bar.', 'At 72 BPM, play G, C, D, then G again, one note each bar. Mute at the bar line before the next root.', 'You can name each root and keep the pulse when the pitch changes.']),
  added('bass-box-shapes', 'Root, Fifth & Octave', 'Move one small bass shape instead of hunting notes.', [6, 'Find a root, its fifth, and the octave above without a wide stretch.', 'From G at E fret 3, play D at A fret 5 and G at D fret 5. Shift the same shape to C at A fret 3.', 'You can play both shapes slowly and return to the root. This pattern is an exercise, not a song.']),
];

export const LESSONS: readonly GuidedLesson[] = [
  ...LEGACY_LESSON_DATA.flatMap(category => category.lessons).map(lesson => {
    const [minutes, outcome, practice, readyWhen] = coaching[lesson.id];
    return { ...lesson, minutes, outcome, practice, readyWhen };
  }), ...newLessons,
];
const catalog = new Map(LESSONS.map(lesson => [lesson.id, lesson]));
export interface CurriculumUnit extends Omit<LessonCategory, 'lessons'> { lessons: GuidedLesson[] }
type UnitSpec = [label: string, difficulty: Difficulty, ...ids: string[]];
const guitarSetup: UnitSpec = ['Get comfortable', 'beginner', 'beginner-holding-the-guitar', 'beginner-guitar-anatomy', 'beginner-tuning-up'];
const firstNotes: UnitSpec = ['Read and play your first notes', 'beginner', 'beginner-fretting-notes', 'beginner-reading-tabs', 'music-pulse', 'music-listening'];
const firstChords: UnitSpec = ['Make music with two chords', 'beginner', 'beginner-reading-diagrams', 'beginner-two-chords', 'beginner-basic-strumming', 'beginner-open-chords', 'music-practice'];
const nextGuitar: UnitSpec = ['Build musical vocabulary', 'intermediate', 'intermediate-fingerpicking', 'intermediate-scales-101', 'intermediate-music-theory', 'intermediate-barre-chords'];
const explore: UnitSpec = ['Explore at your own pace', 'advanced', 'advanced-improvisation', 'advanced-techniques', 'advanced-songwriting'];
const paths: Record<LearningInstrument, UnitSpec[]> = {
  acoustic: [guitarSetup, firstNotes, firstChords, nextGuitar, explore],
  electric: [[...guitarSetup, 'electric-setup'], firstNotes, firstChords, ['Rhythm and fretboard', 'intermediate', 'electric-power-chords', ...nextGuitar.slice(2) as string[]], explore],
  classical: [
    ['Balance and first sounds', 'beginner', 'classical-posture', 'beginner-guitar-anatomy', 'beginner-tuning-up', 'classical-first-touch'],
    ['Read, listen and play', 'beginner', 'music-pulse', 'classical-reading-music', 'beginner-fretting-notes', 'beginner-reading-tabs', 'music-listening'],
    ['Melody and accompaniment', 'beginner', 'beginner-reading-diagrams', 'beginner-two-chords', 'beginner-open-chords', 'music-practice'],
    ['Develop your musicianship', 'intermediate', 'intermediate-fingerpicking', 'intermediate-scales-101', 'intermediate-music-theory', 'intermediate-barre-chords'],
  ],
  bass: [
    ['Your first bass notes', 'beginner', 'bass-first-notes', 'bass-right-hand', 'bass-clean-notes'],
    ['Read and keep time', 'beginner', 'bass-reading-tabs', 'music-pulse', 'bass-groove', 'music-listening'],
    ['Build a bass line', 'beginner', 'bass-fretboard', 'bass-roots-fifths', 'bass-reading-music', 'music-practice'],
    ['Original bass patterns', 'beginner', 'bass-quarter-roots', 'bass-box-shapes'],
  ],
};

export function curriculumFor(instrument: LearningInstrument): CurriculumUnit[] {
  return paths[instrument].map(([label, difficulty, ...ids], index) => ({
    id: `${instrument}-${index + 1}`, label: `${index + 1}. ${label}`, difficulty,
    lessons: ids.map(id => {
      const lesson = catalog.get(id);
      if (!lesson) throw new Error(`Unknown curriculum lesson: ${id}`);
      return lesson;
    }),
  }));
}

/** Shared foundations carry over; unrelated and obsolete completions do not inflate the path. */
export function curriculumProgress(instrument: LearningInstrument, completed: Record<string, { completed: boolean }>) {
  const lessons = curriculumFor(instrument).flatMap(unit => unit.lessons);
  return {
    total: lessons.length,
    completed: lessons.filter(lesson => completed[lesson.id]?.completed).length,
    next: lessons.find(lesson => !completed[lesson.id]?.completed) ?? null,
  };
}
