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
  'beginner-reading-diagrams': [
    {
      heading: 'The grid is your guitar, stood upright',
      body: 'Imagine standing the guitar up and looking at the neck head-on. The six vertical lines are the strings: thickest low E on the far left, thinnest high e on the far right - the same order as the letters printed under every diagram. The horizontal lines are the metal frets. The thick bar across the top is the nut, where the strings leave the headstock.',
    },
    {
      heading: 'Dots are fingers, numbers say which one',
      body: 'A dot means press that string down just behind that fret - not on the metal, and not in the middle of the gap. The number inside is which finger: 1 is your index, 2 your middle, 3 your ring, 4 your little finger. The frets are numbered down the left edge, so a dot on row 2 means the second fret.',
    },
    {
      heading: 'Above the nut: circles and crosses',
      body: 'A circle above a string means play it open - let it ring without pressing anything. A cross means do not play that string at all; either skip it or deaden it by resting a finger against it. Getting the crosses right is what stops a chord sounding muddy.',
    },
    {
      heading: 'One finger, several strings',
      body: 'When a chord needs one finger flattened across several strings you will see a solid bar with a single number on it instead of separate dots. That is a barre. Lay the finger flat and roll it slightly onto its bony side; the fleshy middle swallows the strings.',
    },
    {
      heading: 'Shapes further up the neck',
      body: 'Most shapes sit at the nut, so the numbers down the side start at 1. When a chord lives higher up, the numbers start wherever the shape does - a diagram numbered 4, 5, 6 is played at the fourth fret and up. Check that column before you put your hand down.',
    },
    {
      heading: 'Try it',
      body: 'Open the Chords tab and find Em. Two dots, both on fret 2, fingers 2 and 3, four open circles and no crosses - so you strum all six strings. Then look at F: a bar across fret 1, which is the same idea with one finger doing more work. Tap "Hear it" on each to check what you play matches.',
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
      body: 'Set the metronome tab to 60 BPM. Mute the strings lightly with your fretting hand and play one downstroke per click: down, down, down, down. Stay exactly on the click for a full minute before speeding up.',
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
      body: 'The hard part is switching. Pick two chords (G to C is a great start) and switch back and forth slowly, strumming once per chord. Do 20 clean changes. Look for shared fingers or short paths - keep your fingers close to the strings.',
    },
    {
      heading: 'One-minute changes',
      body: 'Time yourself: how many clean G-to-C changes can you make in 60 seconds? Track your number each day. When you pass 30, add D and cycle G - C - D. You are now playing real progressions.',
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
      heading: 'Common symbols',
      body: 'h = hammer-on (5h7: pick fret 5, hammer your finger onto 7). p = pull-off. Slashes are slides. b = bend the string. x = mute the string with light finger pressure. PM means palm mute near the bridge.',
    },
    {
      heading: 'Try it',
      body: 'Play the E minor pentatonic scale from tab, string by string: low E frets 0 and 3, A frets 0 and 2, D frets 0 and 2, G frets 0 and 2, B frets 0 and 3, high e frets 0 and 3. Ascend then descend until it flows.',
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
      body: 'Learn p-i-m-a-m-i (bass, G, B, e, B, G) as a rolling six-note arpeggio. Play it over Em, then C, then G, then D, letting every note ring into the next. Slow and even beats fast and lumpy - use the metronome at 50 BPM, one note per click.',
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
      body: 'Play C major starting at the A-string 3rd fret: A string frets 3-5-7, D string frets 3-5-7, G string frets 4-5. Say the note names aloud as you play. Then play it descending. Use one finger per fret - the index covers the lowest fret in the position.',
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
      body: 'An interval is the distance between two notes, counted in half steps (frets). The ones to know: 3 frets = minor third (sad), 4 frets = major third (happy), 7 frets = perfect fifth (power chords). Chords are just stacked thirds.',
    },
    {
      heading: 'How chords are built',
      body: 'A major chord = root + major third + perfect fifth. A minor chord lowers the third by one fret. That single note is the entire difference between happy and sad. A 7th chord stacks one more third on top.',
    },
    {
      heading: 'Keys and the chord family',
      body: 'Harmonizing the major scale gives seven chords that all sound good together. In C: C, Dm, Em, F, G, Am, Bdim. The pattern (major, minor, minor, major, major, minor, diminished) is identical in every key. Musicians label the positions with Roman numerals: I, ii, iii, IV, V, vi, vii.',
    },
    {
      heading: 'Progressions you already know',
      body: 'I-V-vi-IV (C-G-Am-F) is the most used progression in pop music. ii-V-I rules jazz. I-IV-V is the blues. Play C-G-Am-F in a loop and you will recognize a dozen songs. Then transpose it to G major (G-D-Em-C) using the Roman numerals.',
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
      body: 'A blank page is the enemy. Pick a key, a tempo, and four chords from that key’s family before you write anything else. Limitation breeds ideas: hundreds of great songs are I-V-vi-IV with a strong melody on top.',
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
