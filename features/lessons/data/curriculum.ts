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
  added('acoustic-pick-pulse', 'Pick Pulse on One Chord', 'Hold a pick and play even downstrokes on one open chord.', [5, 'Keep four calm downstrokes per bar on Em without chasing speed.', 'Form Em. At a slow count, play four pick downstrokes, rest one bar, and repeat. Listen for even volume.', 'You can play several bars of even downs on Em while counting; the pick does not flip or drop.']),
  added('acoustic-three-chord-loop', 'Three Open Chords, Slow Loop', 'Change slowly among G, C, and D with pick downstrokes.', [7, 'Complete a slow G–C–D–G loop without freezing on the fretting hand.', 'Play two bars each of G, C, D, and G with downstrokes only. Stop the previous chord before the next.', 'You can name each shape and keep a slow count through the loop at least twice.']),
  added('electric-fret-mute', 'Quiet the Unused Strings', 'Keep only the notes you fretted ringing while neighbours stay silent.', [5, 'Lightly mute unused strings with the fretting hand while two intended notes sound.', 'Form a root and fifth on frets 3 and 5. Touch the quiet strings with spare flesh of the fretting hand.', 'You hear the two fretted notes clearly and the other strings stay quiet without clamping.']),
  added('electric-palm-mute', 'Soft Palm Edge Mute', 'Shorten notes with light palm contact after fretting-hand muting feels ordinary.', [6, 'Shorten a root-and-fifth pair with light palm contact without choking the pitch flat.', 'Play frets 3 and 5, rest the picking-hand palm edge near the bridge, then release so the same frets ring.', 'You can switch between a short muted pair and a ringing pair on a clean sound.']),
  added('classical-rest-stroke', 'Rest Stroke on Open Treble', 'Finish each pluck against the neighbouring thicker string.', [5, 'Play open G, B and high e with a controlled rest stroke.', 'On open G, land i on the B string after the pluck. Repeat with m, then move to B and high e.', 'Several notes sound firm, and the finger lands on the next thicker string without a tense wrist.']),
  added('classical-treble-melody', 'A Short Treble Melody', 'Link a few first-position notes into one quiet phrase.', [6, 'Play an original eight-note phrase on G, B and high e in frets 0–3.', 'Learn the eight drill notes in order. Name the string and fret before each note. Repeat the phrase twice.', 'You can play the phrase slowly with clear starts and without hunting for each fret.']),
  added('bass-fingers-hearing', 'Fingers, Pick and Comfortable Volume', 'Choose a plucking approach and keep bass volume easy on the ears.', [5, 'Name fingers versus pick, default to alternating fingers, and set a comfortable volume.', 'Pluck open E and A with index then middle at a low volume. Try one gentle pick stroke, then return to fingers.', 'You can say which approach you are using and play several open notes without turning up too far.']),
  added('bass-roots-form-a', 'Twelve Roots in A', 'Support a twelve-bar root form with one whole-note root per bar.', [7, 'Play the original A–E–A–E–D–A–E–A–A–E–D–A roots, one note per bar.', 'At a slow count, hold each root for four beats on the E and A strings, then mute before the next root.', 'You can name each root and keep one note per bar through the form.']),
  added('bass-low-b', 'Low B and Quiet Neighbours', 'Find open low B, then keep it silent while E–A–D–G still speak.', [6, 'Locate open B0 beside E and mute it while familiar four-string notes play.', 'Pluck open B once, then play open E with B quiet. Repeat on A, D and G.', 'You can find B and keep it from ringing when you do not mean to play it.']),
  added('bass-high-c', 'High C Without the Rattle', 'Find open high C, then keep that thin string quiet.', [6, 'Locate open C above G and mute it during E–A–D–G notes.', 'Pluck open C once, then return to open G with C silent. Check E, A and D the same way.', 'You can find high C and stop it rattling when the line stays on the lower four strings.']),
  added('guitar-baritone-range', 'Baritone Range in B Standard', 'Retune to B standard after the six-string path and check the same layout a fourth lower.', [5, 'Confirm baritone strings sit a fourth below standard guitar names.', 'Finish a six-string path first. Tune B E A D F# B and play one familiar shape slowly.', 'You can name the lowest string as B and keep the fretting shapes you already know.']),
  added('guitar-7-mute', 'Quiet the Low B on Seven', 'Find the extra low B and keep it silent on the upper six.', [5, 'Mute the seventh string while notes on the familiar six still sound.', 'Finish a six-string path first. Pluck low B once, then play open low E with B quiet.', 'Low B stays silent unless you choose it.']),
  added('guitar-8-mute', 'Quiet F-sharp and B on Eight', 'Find the two extra low strings and keep both quiet.', [5, 'Mute F# and B while the upper six strings play.', 'Finish a six-string path first. Sound each low string once, then mute both and play open E.', 'Both extra strings stay quiet during an ordinary six-string note.']),
  added('guitar-12-courses', 'Twelve-String Courses and a Light Touch', 'Treat twelve strings as six pairs, with a lighter attack and frequent tuning.', [6, 'Play one course as a pair and notice when the octave string slips.', 'Finish a six-string path first. This is a poor first instrument. Brush one course gently and retune.', 'You can hear both strings of a course and you retune before the pair sours.']),
  added('uke-hold-tune', 'Hold Steady, Then Tune GCEA', 'Balance a ukulele and tune re-entrant high G, C, E, A.', [5, 'Name the four strings and tune them without gripping the neck.', 'Seat the ukulele, release the fretting hand, and tune G C E A. High G is the usual beginner tuning. Low G is a different melody string. Baritone D G B E is not this tuning.', 'The instrument stays put and you can name which string you are tuning.']),
  added('uke-two-chord-strum', 'Two Shapes and a Soft Downstrum', 'Strum open C and G7 slowly. Do not use a guitar chord chart.', [6, 'Change between two ukulele shapes with downstrums only.', 'On high-G tuning, form C and G7 in the ukulele’s own shapes. On baritone, use a I and V idea in D G B E, still not a guitar diagram.', 'You can change the two shapes slowly and the neck stays supported by your body.']),
  added('uke-open-pluck', 'Open-String Melody, One Note at a Time', 'Pluck a short original line on open ukulele strings.', [5, 'Play four open strings in an order you can repeat.', 'Pluck G, C, E, A, then A, E, C, G. Even tone matters more than speed. Four-line tab can come later.', 'You can repeat the open-string order without looking for which string is which.']),
  added('mandolin-tune-courses', 'Tune the Four Courses', 'Tune G D A E as doubled courses, not single guitar strings.', [5, 'Hear both strings of one course at the same pitch.', 'Use the mandolin tuner. Tune each pair together. Courses are tuned in fifths.', 'Each course’s two strings agree, and you can name G, D, A and E.']),
  added('mandolin-clean-course', 'One Clean Open Course', 'Pick through both strings of one open course.', [5, 'One downstroke sounds both strings of an open course evenly.', 'Pick the G course only. If one string is dull, adjust the pick so it crosses both.', 'The pair rings together and the other courses stay quiet.']),
  added('mandolin-open-fifth', 'A Fifth Across Two Courses', 'Sound a fifth from one course to the next, then fret one course cleanly.', [6, 'Play an open course and the next open course as a fifth.', 'Play open G then open D. Then fret both strings of the D course at fret 2 and listen for a clear pair.', 'You can tell a fifth from a guitar-style fourth, and one fretted course speaks on both strings.']),
  added('banjo-open-g-fifth', 'Open G and the Short Fifth', 'Tune g D G B D and find the short fifth-string drone.', [6, 'Name the short fifth string and tune open G.', 'The fifth string is the short one nearest you. It is a high G drone, not a sixth guitar string. Clawhammer is a different right hand and is not this path.', 'You can point to the fifth string and the four long strings are in open G.']),
  added('banjo-strum-g', 'Strum Open G', 'Brush slow downstrokes on the open-G chord.', [6, 'Strum open G so the strings you intend can ring.', 'Open G is already the tuning. Add C and D7 later; this lesson is only the open G brush.', 'Several slow downs sound like a chord, not a scrape.']),
  added('banjo-eight-forward', 'Slow Eight-Note Forward Roll', 'Play thumb, index and middle in one original eight-note roll.', [8, 'Keep an even roll at a slow pulse on open strings.', 'At about 60 BPM, alternate thumb, index and middle across the long strings. This is not a copied song lick.', 'You can say thumb, index or middle for each note of the eight.']),
  added('violin-rest-play', 'Rest Position and Playing Position', 'Move between a quiet rest hold and a balanced playing posture.', [5, 'The violin stays up without the left hand gripping the neck.', 'Practice rest position, then playing position. No bow yet. There are no frets.', 'You can change position without the scroll diving.']),
  added('violin-bow-open', 'Bow Hold and Open-String Quarters', 'Settle the bow, then play even quarters on one open string.', [6, 'Draw four calm quarter notes on one open string.', 'Use a soft bow hold. Play open A or open D. The app does not grade bow direction.', 'The notes are even and the bow stays on one string.']),
  added('violin-open-listen', 'Open String High or Low', 'Use the tuner to hear whether an open string is sharp or flat.', [5, 'Decide if an open string must rise or fall.', 'Tune one open string with the violin profile. Fingered notes are not scored.', 'You can say sharp or flat before you turn a peg.']),
  added('viola-hold', 'Seated or Standing Viola Hold', 'Balance the larger instrument so neither hand props it up.', [5, 'The viola stays stable and the left hand is free.', 'Try sitting and standing. Do not use a violin fingering chart.', 'Shoulders stay easy and the scroll does not droop.']),
  added('viola-bow-open-cg', 'Bow on Open C and G', 'Draw the bow on the two lowest open strings before adding fingers.', [6, 'Play open C, then open G, with separate bows.', 'Stay on open strings. The app does not grade the bow.', 'Each string speaks without the bow slipping to its neighbour.']),
  added('viola-alto-landmarks', 'Alto Clef Open-String Names', 'Link alto-clef names to open C, G, D and A.', [6, 'Name the four open strings and know they are read in alto clef.', 'Say C, G, D, A from low to high. This is not treble clef and not a copied staff exercise.', 'You can name each open string and you do not call them violin letters.']),
  added('cello-endpin-sit', 'Endpin and Sitting Balance', 'Seat the cello so it stands without the left hand holding it up.', [5, 'The endpin length lets both hands stay free.', 'Sit, set the endpin, and take the left hand off the neck. This is not a standing violin posture.', 'The cello stays while you rest both hands.']),
  added('cello-bow-open-gd', 'Cello Bow Hold and Open G–D', 'Use a cello bow hold, then draw quarters on open G and D.', [6, 'Play separate bows on open G and open D.', 'The pinky is not on top of the stick the way a violin bow often is. Thumb position is not this lesson.', 'Open G and D speak with separate bows and a relaxed arm.']),
  added('cello-first-position', 'First Position on G and D', 'Place the left hand in first position for a short original pattern.', [6, 'Play a few first-position notes on G and D without an exam piece.', 'Stay in first position. The tuner may check open strings only. It does not grade the bow.', 'You can find first position again after you take the hand away.']),
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
  acoustic: [
    guitarSetup,
    ['Strum a few open chords', 'beginner', 'beginner-reading-diagrams', 'beginner-two-chords', 'acoustic-pick-pulse', 'beginner-basic-strumming', 'beginner-open-chords', 'acoustic-three-chord-loop'],
    ['Read notes and listen', 'beginner', 'beginner-fretting-notes', 'beginner-reading-tabs', 'music-pulse', 'music-listening', 'music-practice'],
    ['Build musical vocabulary', 'intermediate', 'intermediate-scales-101', 'intermediate-music-theory', 'intermediate-fingerpicking', 'intermediate-barre-chords'],
    explore,
  ],
  electric: [
    guitarSetup,
    ['First fretting', 'beginner', 'beginner-fretting-notes', 'beginner-reading-tabs', 'music-pulse', 'music-listening'],
    ['Clean sound and muting', 'beginner', 'electric-setup', 'electric-fret-mute'],
    ['A few open chords', 'beginner', 'beginner-reading-diagrams', 'beginner-two-chords', 'beginner-basic-strumming', 'beginner-open-chords', 'music-practice'],
    ['Root, fifth, then palm', 'beginner', 'electric-power-chords', 'electric-palm-mute'],
    ['Names and scales', 'intermediate', 'intermediate-scales-101', 'intermediate-music-theory'],
    explore,
  ],
  classical: [
    ['Balance and first sounds', 'beginner', 'classical-posture', 'beginner-guitar-anatomy', 'beginner-tuning-up', 'classical-first-touch', 'classical-rest-stroke'],
    ['Read, listen and play', 'beginner', 'music-pulse', 'classical-reading-music', 'beginner-fretting-notes', 'beginner-reading-tabs', 'music-listening'],
    ['A short melody first', 'beginner', 'classical-treble-melody', 'beginner-reading-diagrams', 'music-practice'],
    ['Simple accompaniment', 'beginner', 'beginner-two-chords', 'beginner-open-chords'],
    ['Develop your musicianship', 'intermediate', 'intermediate-fingerpicking', 'intermediate-scales-101', 'intermediate-music-theory'],
  ],
  bass: [
    ['Your first bass notes', 'beginner', 'bass-first-notes', 'bass-fingers-hearing', 'bass-right-hand', 'bass-clean-notes'],
    ['Read and keep time', 'beginner', 'bass-reading-tabs', 'bass-reading-music', 'music-pulse', 'bass-groove', 'music-listening'],
    ['Practice habits and landmarks', 'beginner', 'music-practice', 'bass-fretboard'],
    ['Build a bass line', 'beginner', 'bass-roots-fifths', 'bass-quarter-roots', 'bass-roots-form-a', 'bass-box-shapes'],
  ],
  bass5: [['After four strings', 'beginner', 'bass-low-b']],
  bass6: [['After four strings', 'beginner', 'bass-low-b', 'bass-high-c']],
  baritone: [['After six strings', 'beginner', 'guitar-baritone-range']],
  guitar7: [['After six strings', 'beginner', 'guitar-7-mute']],
  guitar8: [['After six strings', 'beginner', 'guitar-8-mute']],
  guitar12: [['After six strings', 'beginner', 'guitar-12-courses']],
  ukulele: [['First ukulele sounds', 'beginner', 'uke-hold-tune', 'uke-two-chord-strum', 'uke-open-pluck']],
  mandolin: [['First mandolin sounds', 'beginner', 'mandolin-tune-courses', 'mandolin-clean-course', 'mandolin-open-fifth']],
  banjo: [['Open G, not clawhammer', 'beginner', 'banjo-open-g-fifth', 'banjo-strum-g', 'banjo-eight-forward']],
  violin: [['Bow before fingers', 'beginner', 'violin-rest-play', 'violin-bow-open', 'violin-open-listen']],
  viola: [['Alto clef, bow first', 'beginner', 'viola-hold', 'viola-bow-open-cg', 'viola-alto-landmarks']],
  cello: [['Seated, bow first', 'beginner', 'cello-endpin-sit', 'cello-bow-open-gd', 'cello-first-position']],
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
