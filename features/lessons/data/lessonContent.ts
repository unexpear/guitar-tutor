import { FOUNDATION_CONTENT } from './foundationContent';

export interface LessonSection {
  heading: string;
  body: string;
}

/**
 * Instructional content for each lesson, keyed by lesson id.
 * The Guitar Anatomy lesson has its own interactive component and
 * intentionally has no entry here.
 */
export const LESSON_CONTENT: Record<string, LessonSection[]> = {
  ...FOUNDATION_CONTENT,
  'bass-first-notes': [
    { heading: 'Tune before you practise', body: 'This path uses a standard four-string bass: E1-A1-D2-G2 from the thickest string to the thinnest. Use Tune for this path, start listening, select one string, pluck once and let it ring. Guided mode helps on low E because a phone can hear a stronger overtone than the fundamental. Make small adjustments and stop if you are unsure which tuning machine or octave is correct.' },
    { heading: 'Clean low notes', body: 'Rest the bass against your body with the neck slightly raised. Fret immediately behind the metal fret using the pad near your fingertip. Use only enough pressure to stop buzz. If the tuner jumps, mute the other strings with both hands and move the phone closer to the instrument or a quiet amplifier.' },
    { heading: 'Try the open-string drill', body: 'Open the listening drill and use Follow Me. It waits while you find E, A, D and G. Pluck just one string and quiet the others. The pitch score is a useful prompt, not a test of posture or tone; listen for yourself and take relaxed breaks.' },
  ],
  'bass-right-hand': [
    { heading: 'Alternate index and middle', body: 'Pluck toward the next thicker string, alternating index and middle fingers. Start on one open string and listen for equal volume and tone. The motion is small: the finger passes through the string and comes to rest on its neighbour instead of pulling upward away from the body.' },
    { heading: 'Muting is half the technique', body: 'Let the thumb rest on a pickup or a lower string. As you move to thinner strings, let the thumb follow. Your fretting hand can lightly touch unused higher strings. Play E-E-rest-E at 60 BPM and listen during every rest; silence is the goal.' },
    { heading: 'Practise one change at a time', body: 'Use the listening drill for slow E-to-A changes. Alternate index and middle, and silence the old string before the next note. The app listens for pitch, not which finger you used or how well you muted: judge those by listening and looking at your hand.' },
  ],
  'bass-fretboard': [
    { heading: 'Learn landmarks first', body: 'The open strings repeat at fret 12. On any string, the octave is twelve frets higher. A second useful octave shape is two strings thinner and two frets higher, as long as both strings are tuned in fourths. Start with E, A, D and G at frets 0, 5, 7 and 12.' },
    { heading: 'Practice two octave pairs', body: 'On your four-string bass, play open E and then E at D-string fret 2. Next play open A and A at G-string fret 2. Use this lesson’s bass octave drill. Guitar-only fretboard games use a different string map, so they are not a substitute for these bass targets.' },
  ],
  'bass-groove': [
    { heading: 'Make the click feel like a drummer', body: 'Set the metronome to 60 BPM and play one root on each click. When that is effortless, keep the same tempo and play two even eighth notes per click. Do not chase a late note; leave it behind and meet the next click cleanly.' },
    { heading: 'Add rests and changes', body: 'Try one bar each of E, A, D and A. Then play beat one, rest on beat two, and play beats three and four. Count through the rest and stop the ringing string deliberately. Use Tempo for the click; it does not record or grade your performance. Consistent spacing matters more than speed.' },
  ],
  'beginner-holding-the-guitar': [
    {
      heading: 'Sit down and get it settled',
      body: 'Sit forward on a chair with no arms, both feet flat. Rest the narrow waist of the guitar on your right thigh if you are right handed, left thigh if you are left handed. The neck points away from you and slightly upward - never down at the floor. Pull the body gently back against your chest with your forearm so it stops sliding. You should be able to let go with your fretting hand and the guitar stays put. If you are holding it up with your fretting hand, you cannot use that hand to play.',
    },
    {
      heading: 'What each hand does',
      body: 'The hand nearest the neck presses the strings - that is the fretting hand. The hand over the body plays them - that is the strumming or picking hand. Right handed players fret with the left and strum with the right. If you are left handed and the guitar is strung for it, mirror everything in these lessons.',
    },
    {
      heading: 'Holding a pick',
      body: 'A pick is the small plastic triangle that came with the guitar. Curl your index finger as if holding a mug, lay the pick flat across it with the point sticking out about half a centimetre, then press your thumb down on top. Hold it firmly enough that it does not fall, loosely enough that someone could pull it out. Too much sticking out gives a floppy, weak sound; too little and you catch your fingers on the strings.',
    },
    {
      heading: 'You can use your thumb instead',
      body: 'None of this course requires a pick. If it feels hopeless at first, brush the strings with the side of your thumb and come back to the pick later. Plenty of players never use one.',
    },
    {
      heading: 'Keep practice comfortable',
      body: 'Start with short, relaxed attempts and use only the pressure needed for a clear note. Take breaks and stop if playing hurts, causes tingling, or leaves your skin sore. Do not push through pain for a score or streak. A teacher or instrument technician can help check playing position and a difficult setup.',
    },
  ],
  'beginner-tuning-up': [
    {
      heading: 'Do this before you play anything',
      body: 'Check tuning before practice. Temperature, handling and time can change it, even when a guitar sounded fine last time. The lesson drills assume standard tuning; another tuning can make correct finger positions sound like different target notes. Use Tune for this path to select the intended instrument and tuning.',
    },
    {
      heading: 'The six strings and their names',
      body: 'Held in playing position, the thickest string is nearest your face and the thinnest is nearest the floor. From thickest to thinnest they are E, A, D, G, B and E again. The thick one is the 6th string, the thin one is the 1st. Guitarists count them backwards like that, so "the 6th" always means the fat low one.',
    },
    {
      heading: 'Using the tuner in this app',
      body: 'Open the Tuner tab and start listening. Select the labeled string, pluck that same string and let it ring. Green is within your chosen tuning window and amber is close. Read the flat/sharp direction before adjusting; red alone does not tell you which way to turn. Check the string label rather than relying on left or right placement.',
    },
    {
      heading: 'Which way to turn the peg',
      body: 'Tightening raises pitch and loosening lowers it, but clockwise direction depends on the peg and string winding. Confirm the correct peg and make a tiny change while plucking again. If the reading is far from the target or you are unsure of the octave, stop and check with a reference or teacher. Do not keep tightening an uncertain string to chase the display.',
    },
    {
      heading: 'Go through all six',
      body: 'Work from the thick E across to the thin one. Tuning one string can pull the others slightly out, so go round twice. New strings drift a lot for the first few days - that is the strings stretching, not you doing it wrong. When all six show green you are ready.',
    },
  ],
  'beginner-fretting-notes': [
    {
      heading: 'Press just behind the fret',
      body: 'The frets are the metal strips across the neck. To play the third fret you press the string down in the gap between the second and third fret, right up close behind the third one - not on top of the metal, and not in the middle of the gap. On the metal gives a dead thud. In the middle of the gap makes you press twice as hard for a buzzy note. Close behind the fret takes almost no pressure at all.',
    },
    {
      heading: 'Fingertips, not the flats of your fingers',
      body: 'Curl your fingers so you are pressing with the very tip, coming down onto the string almost straight from above. Flat fingers lie across their neighbours and silence them, which is why a chord can sound like two notes instead of six. Keep your fingernails on that hand short - if a nail hits the fretboard before the fingertip does, you cannot press hard enough no matter how you try.',
    },
    {
      heading: 'Thumb behind the neck',
      body: 'Put the pad of your thumb flat on the back of the neck, roughly behind your middle finger, pointing up toward the ceiling rather than along the neck. Your fingers and thumb then pinch the neck between them and the pressure comes from that pinch, not from squeezing with your whole arm. If your thumb is hooked over the top of the neck your fingers cannot curl, and everything buzzes.',
    },
    {
      heading: 'Fixing a buzz',
      body: 'A buzzing or muted string has one of four causes, and they are quick to check. One: your finger is too far from the fret - slide it forward. Two: you are not pressing hard enough - press a little more, but only a little. Three: a neighbouring finger is lying across the string - curl it up onto its tip. Four: your strumming hand is catching a string the chord says not to play. Pluck the strings one at a time to find which one is wrong instead of strumming and guessing.',
    },
    {
      heading: 'Try it',
      body: 'Start the practice drill below and play one target at a time. Follow Me waits for the pitch. Listen for buzz yourself: the app cannot see your fingers or certify a clean tone. If a note is missed, check tuning, input level, microphone position and room noise as well as the fingering.',
    },
  ],
  'beginner-reading-diagrams': [
    {
      heading: 'The grid is your guitar, stood upright',
      body: 'Imagine standing the guitar up and looking at the neck head-on. In the standard view, the six vertical lines run from the thick low E on the far left to the thin high e on the far right. Left-handed view mirrors that order. The letters printed underneath are always the safest check. The horizontal lines are the metal frets, and the thick bar across the top is the nut.',
    },
    {
      heading: 'Dots are fingers, numbers say which one',
      body: 'A dot means press that string down just behind that fret - not on the metal, and not in the middle of the gap. The number inside is which finger: 1 is your index, 2 your middle, 3 your ring, 4 your little finger. Read the actual fret number printed down the side; a dot in the row labelled 2 belongs at the second fret.',
    },
    {
      heading: 'Above the nut: circles and crosses',
      body: 'A circle above a string means play it open - let it ring without pressing anything. A cross means do not play that string at all; either skip it or deaden it by resting a finger against it. Getting the crosses right is what stops a chord sounding muddy.',
    },
    {
      heading: 'One finger, several strings',
      body: 'Sometimes you will see a solid bar with one number on it instead of separate dots. That means one finger lies flat across several strings at once, and it is called a barre. You do not need one yet - every chord in the beginner lessons uses separate fingers - but now you know what the bar means when you meet it in the Chords tab.',
    },
    {
      heading: 'Shapes further up the neck',
      body: 'Most shapes sit at the nut, so the numbers down the side start at 1. When a chord lives higher up, the numbers start wherever the shape does - a diagram numbered 4, 5, 6 is played at the fourth fret and up. Check that column before you put your hand down.',
    },
    {
      heading: 'Try it',
      body: 'Open the Chords tab and find Em. Two dots, both on fret 2, fingers 2 and 3, four open circles and no crosses - so you play all six strings. Now find A: three dots side by side on fret 2, one cross on the thickest string, so that one stays silent. Tap "Hear it" on each so you know what you are aiming for.',
    },
  ],
  'beginner-basic-strumming': [
    {
      heading: 'Hold the pick loosely',
      body: 'Grip the pick between your thumb and the side of your index finger, with just enough pressure that it does not slip. A tight grip makes your strumming stiff and loud; a relaxed grip lets the pick glide over the strings.',
    },
    {
      heading: 'Strum from the wrist',
      body: 'Keep your elbow fairly still and let the motion come from a relaxed wrist rotation, like shaking water off your hand. Aim your strums at the strings between the sound hole and the bridge.',
    },
    {
      heading: 'Downstrokes on the beat',
      body: 'Set the metronome tab to 70 BPM, the same tempo the practice drill uses. Mute the strings lightly with your fretting hand and play one downstroke per click: down, down, down, down. Stay exactly on the click for a full minute before speeding up.',
    },
    {
      heading: 'Add upstrokes',
      body: 'Now play down-up on each click ("1-and 2-and..."). The up should be quieter and catch only the top three or four strings. When that feels even, try the most common pattern in pop music: D, D-U, U-D-U.',
    },
  ],
  'beginner-open-chords': [
    {
      heading: 'Start with E minor and A minor',
      body: 'Open the Chords tab and find Em: two fingers, all six strings ring. Press just behind the fret, not on top of it, and curl your fingers so they do not touch neighboring strings. Strum slowly and listen for buzzing, then fix one string at a time. Am adds one finger to the same shape family.',
    },
    {
      heading: 'Add G, C, and D',
      body: 'These three chords power thousands of songs. C and D do not use all six strings - check the chord diagram for the x marks and avoid strumming those strings. Practice each chord until every note rings clearly.',
    },
    {
      heading: 'Practice changes, not chords',
      body: 'The hard part is switching. Pick two chords (Em to Am is the easiest start - they share a finger shape) and switch back and forth slowly, strumming once per chord. Do 20 clean changes. Look for shared fingers or short paths - keep your fingers close to the strings.',
    },
    {
      heading: 'One-minute changes',
      body: 'Time yourself: how many clean G-to-C changes can you make in 60 seconds? Track your number each day. Five in a minute is a real start, twenty is fluent, and when you pass 30, add D and cycle G - C - D. You are now playing real progressions.',
    },
  ],
  'beginner-reading-tabs': [
    {
      heading: 'Six lines, six strings',
      body: 'Tab has six horizontal lines. The BOTTOM line is your thickest string (low E) and the TOP line is your thinnest (high e) - upside down from how you might expect. Numbers on a line tell you which fret to press on that string; 0 means play the string open.',
    },
    {
      heading: 'Read left to right',
      body: 'Numbers in sequence are played one after another. Numbers stacked vertically are played together as a chord. Tab usually does not tell you the rhythm - listen to the song to get the timing.',
    },
    {
      heading: 'Try it',
      body: 'Play these notes from tab, one string at a time: low E frets 0 and 3, A frets 0 and 2, D frets 0 and 2, G frets 0 and 2, B frets 0 and 3, high e frets 0 and 3. Ascend then descend until it flows.',
    },
  ],
  'intermediate-barre-chords': [
    {
      heading: 'The F shape',
      body: 'Lay your index finger flat across all six strings at the first fret, then build an E-major shape with your remaining fingers behind it. Roll the index slightly onto its bony edge - the flat pad is soft and causes buzzing. Keep your thumb low on the back of the neck, roughly opposite your index.',
    },
    {
      heading: 'Use leverage, not squeeze',
      body: 'Barre strength comes from pulling the neck gently back toward you with your arm while the thumb anchors, not from crushing with the hand. If your hand cramps within a minute, you are squeezing. Practice the barre at the 5th fret first - it is much easier there than at the 1st.',
    },
    {
      heading: 'Movable shapes',
      body: 'The magic: the E-shape barre is the same chord at every fret, named by the low-E-string note. 1st fret = F, 3rd = G, 5th = A, 7th = B. The A-shape barre (root on the A string) works the same way: 3rd fret = C, 5th = D. Two shapes give you every major chord.',
    },
    {
      heading: 'Minor versions',
      body: 'Lift your middle finger from the E-shape and you have a minor barre chord (1st fret = Fm). The A-shape minor lowers one note the same way (5th fret = Dm). Practice the cycle: F - Bb - C - Dm using only barre chords.',
    },
  ],
  'intermediate-fingerpicking': [
    {
      heading: 'Assign your fingers',
      body: 'Classical convention: thumb (p) plays the bass strings E, A, and D; index (i) plays G; middle (m) plays B; ring (a) plays high e. Rest your forearm on the guitar body and keep the wrist relaxed and slightly arched.',
    },
    {
      heading: 'Thumb independence first',
      body: 'Hold an Em chord. Play a steady quarter-note bass with just your thumb, alternating the low E and D strings. Once that is automatic, add a single middle-finger note on the B string between bass notes. The thumb must never stop.',
    },
    {
      heading: 'The universal pattern',
      body: 'Learn p-i-m-a-m-i (bass, G, B, e, B, G) as a rolling six-note arpeggio. Play it over Em, then C, then G, then D, letting every note ring into the next. Slow and even beats fast and lumpy - use the metronome at 50 BPM, one note per click. When the notes stay even, open this lesson’s p-i-m-a-m-i practice drill: it plays the same six-note pattern over Em then C and checks each string really rang.',
    },
    {
      heading: 'Travis picking',
      body: 'The pattern behind countless folk and country songs: the thumb alternates two bass strings on every beat while the fingers pinch melody notes on the off-beats. Start with just the alternating bass on a C chord, then add a pinch (thumb + middle together) on beat 1.',
    },
  ],
  'intermediate-scales-101': [
    {
      heading: 'The major scale formula',
      body: 'Every major scale is the same recipe of whole steps (2 frets) and half steps (1 fret): W-W-H-W-W-W-H. Start on any note, apply the formula, and you have that key’s major scale. C major (C D E F G A B) is the one with no sharps or flats.',
    },
    {
      heading: 'One octave, one position',
      body: 'Play C major starting at A-string fret 3: A string 3-5-7, D string 3-5-7, G string 4-5. Say C-D-E-F-G-A-B-C, then descend. This covers more than a four-fret position, so shift the hand comfortably rather than forcing a stretch. The C Major practice drill follows these notes.',
    },
    {
      heading: 'The minor pentatonic',
      body: 'The five-note scale behind most rock and blues solos. A minor pentatonic at the 5th fret: every string at fret 5, plus fret 8 on both E strings and the B string, and fret 7 on the A, D, and G strings. The box is movable - slide it down to fret 3 and it becomes G minor pentatonic.',
    },
    {
      heading: 'Make it musical',
      body: 'Scales are vocabulary, not music. Put on a slow backing track in A minor and play short phrases from the pentatonic box - three to five notes, then breathe. Repetition with small variations sounds like music; running the scale up and down does not.',
    },
  ],
  'intermediate-music-theory': [
    {
      heading: 'Intervals are distances',
      body: 'An interval is a distance between pitches. In this equal-tempered fretboard system, three frets make a minor third, four a major third and seven a perfect fifth. Play the intervals and listen. Major and minor can suggest different moods, but context, rhythm and performance matter too.',
    },
    {
      heading: 'How chords are built',
      body: 'A major triad contains a root, major third and perfect fifth. A minor triad lowers that third by one semitone. A seventh chord adds a seventh above the root; the kind of third and seventh determines the chord quality. Not every chord is built only from stacked thirds.',
    },
    {
      heading: 'Keys and the chord family',
      body: 'Harmonizing the major scale gives seven related chords. In C: C, Dm, Em, F, G, Am, Bdim. The pattern (major, minor, minor, major, major, minor, diminished) is identical in every key. Musicians label the positions with Roman numerals: I, ii, iii, IV, V, vi, vii°. To hear that family rather than only label it, run this lesson’s Family of G practice drill: all seven chords in order, including F#dim, each checked that it rang.',
    },
    {
      heading: 'Progressions you already know',
      body: 'I-V-vi-IV, ii-V-I and I-IV-V are common ways to organize chords. In C major, try C-G-Am-F slowly, then compare G-D-Em-C in G major. The Roman numerals describe each chord’s place in the key, so they help you move a pattern without memorizing a separate rule for every key.',
    },
  ],
  'advanced-improvisation': [
    {
      heading: 'Target the chord tones',
      body: 'Strong improvisers land on notes belonging to the chord underneath them, especially on beat 1. Over Am, aim for A, C, or E; over F, aim for F, A, or C. Scale notes between chord tones are passing colors, not destinations.',
    },
    {
      heading: 'Phrase like a singer',
      body: 'Play a short idea, leave space, then answer it - call and response with yourself. If you cannot sing your line, it is probably a finger pattern rather than a musical idea. Record 30 seconds of your playing and listen for whether it breathes.',
    },
    {
      heading: 'Dynamics and articulation',
      body: 'The same five notes can sound timid or fierce. Vary your pick attack, slide into notes, add vibrato on held notes, and use bends to reach a note instead of just fretting it. One expressive note beats sixteen even ones.',
    },
    {
      heading: 'Practice with intention',
      body: 'Loop a two-chord vamp (Am to D is a classic). Restrict yourself hard: one string only, then one octave, then only three notes. Constraints force melodic thinking. Finish every session by improvising freely for five minutes with no self-judgment.',
    },
  ],
  'advanced-techniques': [
    {
      heading: 'Hammer-ons and pull-offs',
      body: 'Hammer-on: pick a note, then snap another finger down onto a higher fret hard enough to sound the new note without picking. Pull-off: the reverse - flick the finger slightly downward as it leaves the string so it plucks. Practice 5h7p5 trills on each string until both notes are equal volume.',
    },
    {
      heading: 'Slides and vibrato',
      body: 'Keep full pressure while sliding between frets so the note sustains through the movement. For vibrato, bend the string slightly sharp and release, repeatedly and evenly, rotating from the wrist. Slow, wide vibrato sounds vocal; fast, narrow vibrato sounds nervous.',
    },
    {
      heading: 'Bends',
      body: 'Push the string upward (toward the ceiling on the thin strings) with two or three fingers stacked behind the bending finger for support. The skill is pitch accuracy: play fret 7 on the G string, then bend fret 5 up until it matches exactly. Out-of-tune bends are the most common giveaway of a beginner.',
    },
    {
      heading: 'Tapping',
      body: 'Bring your picking-hand index or middle finger over the neck and hammer it onto a fret, then pull off to a note held by your fretting hand. Start with the classic triad loop: tap 12, pull off to 5, hammer 8, repeat. Mute the idle strings with your palm to keep it clean.',
    },
  ],
  'advanced-songwriting': [
    {
      heading: 'Start with a constraint',
      body: 'A blank page is the enemy. Pick a key, a tempo, and four chords from that key’s family before you write anything else. Limitation breeds ideas: hundreds of great songs are I-V-vi-IV with a strong melody on top. When you have your four chords, play them in both orders of this lesson’s Four Chords practice drill - I-V-vi-IV, then the same four starting on the vi - and hear how much of the mood is just order.',
    },
    {
      heading: 'Melody before lyrics',
      body: 'Hum over your progression and record everything on your phone. Look for a hook - a short, repeatable melodic phrase that survives being sung badly. Verse melodies should sit lower and leave room for the chorus to lift.',
    },
    {
      heading: 'Song architecture',
      body: 'The workhorse form: Verse - Chorus - Verse - Chorus - Bridge - Chorus. Verses tell the story, the chorus states the point, and the bridge changes the scenery once (try the vi chord or a borrowed chord there). Contrast is what keeps a listener - change the rhythm, register, or density between sections.',
    },
    {
      heading: 'Finish ugly, then edit',
      body: 'Write a complete bad draft of the whole song before polishing anything. A finished mediocre song teaches you more than ten perfect first verses. Then edit ruthlessly: cut any line, chord, or section the song survives without.',
    },
  ],
};
