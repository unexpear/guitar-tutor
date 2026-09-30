import type { LessonSection } from './lessonContent';

/** Original instructional text; external courses are research, not bundled content. */
export const FOUNDATION_CONTENT: Record<string, LessonSection[]> = {
  'music-pulse': [
    { heading: 'The beat continues', body: 'A pulse is the steady beat you can tap. Rhythm is the pattern of sounds and silences against that pulse. Start without playing: use Tempo at 60 BPM and count 1, 2, 3, 4 with the clicks. These four counts make one bar of 4/4.' },
    { heading: 'A rest is counted silence', body: 'Tap on counts 1 and 3 but keep saying 2 and 4. Do not squeeze the silent beats out. A quarter-note rest lasts one beat in this 4/4 exercise. Silence is part of the music, not a failed note.' },
    { heading: 'Try it with your instrument', body: 'Play one comfortable open string on beat 1. Let it ring for two beats, then stop it gently for beats 3 and 4. Repeat four bars. Next play two even sounds per beat while counting 1-and, 2-and, 3-and, 4-and. Keep the click speed unchanged; only your subdivision changes.' },
  ],
  'music-listening': [
    { heading: 'Hear direction before naming notes', body: 'On a tuned instrument, play an open string and then fret 2 of that same string. The second sound is higher. Reverse the order to hear lower. Play the open string twice to hear same. Listen at a comfortable volume and let one sound finish before the next.' },
    { heading: 'Remember a tiny pattern', body: 'Play frets 0, 2, 0 on one string. Pause, then repeat it from memory. Describe the shape as up then down, or hum it if comfortable. Change to 0, 0, 2 and notice that the notes are similar but the order is different. This is a generic listening exercise, not a song recording.' },
    { heading: 'Listen to a piece you choose', body: 'Use music you already have permission to play. Tap its pulse, notice a repeated section, and listen for where the bass or melody rests. You do not need to identify every chord. The aim is one musical observation, followed by a short idea you can try on your own instrument.' },
  ],
  'music-practice': [
    { heading: 'Keep the session small', body: 'Tune first. Spend two minutes revisiting something comfortable, three minutes on one small challenge, and two minutes enjoying a pattern you can already play. Adjust the times to your day. Stop and rest if playing hurts; a lesson count is never a reason to force your hands.' },
    { heading: 'Change one thing at a time', body: 'If a passage breaks down, use fewer notes, a slower pulse or a shorter section. Repeat comfortably, then join it to the next section. Do not change speed, fingering and rhythm together. A missed day does not mean you need to start over.' },
    { heading: 'Check readiness, not a deadline', body: 'Use each lesson’s readiness question as a self-check. Marking a lesson practised records your progress; it does not certify mastery. Repeat lessons freely and keep one enjoyable review in every session. If you record yourself using another app, listen for one improvement rather than judging the whole performance.' },
  ],
  'beginner-two-chords': [
    { heading: 'Make E minor first', body: 'Use the Em diagram shown here: place finger 2 on the A string at fret 2 and finger 3 on the D string at fret 2. Keep the other strings open. Pluck each string slowly, adjusting one unclear note at a time. Use the smallest comfortable pressure that gives a clean sound.' },
    { heading: 'Then make A minor', body: 'For Am, use finger 1 on B fret 1, finger 2 on D fret 2 and finger 3 on G fret 2. Leave A and high e open, and do not play the thick low E. Read the diagram’s mute mark before strumming.' },
    { heading: 'Change without a race', body: 'Form Em, play once, relax, then form Am. Take as much time as you need. Use the two-chord practice drill in Follow Me. The microphone looks for chord-tone evidence, not your actual finger placement or proof that every string is correct. Listen string by string if a chord is unclear; use the self-check even when the detector struggles.' },
  ],
  'electric-setup': [
    { heading: 'Start with a clear sound', body: 'Before plugging in, lower the amplifier volume. Use a clean channel or turn distortion down, then raise the volume gently until you can hear comfortably. Effects can hide unclear notes and make microphone feedback less dependable. You do not need a loud amp to learn.' },
    { heading: 'Learn what your hands silence', body: 'Play one note and listen for other strings ringing sympathetically. Lightly touch unused strings with whichever hand can do so comfortably. Compare a deliberately ringing note with a deliberate stop. The aim is control, not clamping every string with force.' },
    { heading: 'A phone hears the room too', body: 'Keep the speaker and phone close enough for a clear note, but not so loud that the sound distorts. Choose the electric guitar tuner when tuning. If the practice detector misses a note, check tuning, room sound and input level before changing a comfortable hand position.' },
  ],
  'electric-power-chords': [
    { heading: 'Root plus fifth', body: 'A two-note power shape contains a root and a perfect fifth, with no third. It is therefore neither a complete major nor minor triad. For G5, play the low E string at fret 3 (G) and the A string at fret 5 (D). Use index and ring or little finger as comfortable.' },
    { heading: 'Move the shape and mute the rest', body: 'Keep the same spacing and move to E fret 5 plus A fret 7 for A5. Play only those two strings. Let spare parts of the fretting hand lightly quiet the unused strings without pressing them into new notes. Use a clean sound while learning.' },
    { heading: 'Practice a slow change', body: 'Play G5 for a bar, release, then A5 for a bar at an easy pulse. Shorten the attempt if your hand tires. This lesson uses your listening self-check rather than pretending a single detected note proves a two-note chord was played.' },
  ],
  'classical-posture': [
    { heading: 'Let support carry the guitar', body: 'Sit on a stable chair with enough room for both arms. A guitar support or a footstool can raise the neck; choose a comfortable arrangement rather than forcing a pose. In a common right-handed classical position the waist rests on the left thigh, with the neck raised. Mirror the arrangement for a left-handed instrument.' },
    { heading: 'Check the hands are free', body: 'The instrument should remain balanced when the fretting hand releases the neck. Keep shoulders relaxed and avoid a sharply bent wrist. Adjust the support or chair before adding finger pressure. A teacher can help find an arrangement that fits your body.' },
    { heading: 'Begin with nylon-string touch', body: 'You do not need a pick or long nails for these first exercises. Use a gentle fingertip pluck and listen for an even note. Take short breaks, and stop if the position or movement causes pain. The next lesson uses open treble strings so you can focus on one hand first.' },
  ],
  'classical-first-touch': [
    { heading: 'Name the playing fingers', body: 'Fingerstyle notation uses p for thumb, i for index, m for middle and a for ring on the plucking hand. These are different from fretting-hand numbers 1, 2, 3 and 4. On a left-handed instrument the roles swap hands; the notation still names the roles.' },
    { heading: 'A gentle free stroke', body: 'Pluck the open G string with i, then m, letting each finger travel past the string without landing on its neighbour. This is a free stroke. Use a small movement and a relaxed hand. A rest stroke finishes against the neighbouring thicker string; it is another useful technique, not a requirement to rush into today.' },
    { heading: 'Three strings, one clear sound at a time', body: 'Try open G, B and high e in the practice drill. Alternate i and m and let the sounds stay even. The microphone checks the pitch, not which finger you used. Listen for your own tone and pause whenever the movement becomes tense.' },
  ],
  'classical-reading-music': [
    { heading: 'A staff shows pitch', body: 'Five horizontal lines form a staff. Notes sit on a line or in a space; moving upward generally means a higher written pitch. A treble clef fixes the letter names. From the bottom, its lines are E-G-B-D-F and its spaces are F-A-C-E. These are staff positions, not fret numbers.' },
    { heading: 'Connect three open strings', body: 'Use the guide shown here for open G, B and high e. Guitar notation is normally written an octave above the sound: open G3 is written G4, B3 as B4, and E4 as E5. A tuner reports the sounding octave, so this difference is expected. Start with these three landmarks instead of memorizing the whole staff at once.' },
    { heading: 'Read rhythm separately', body: 'In 4/4, a filled notehead with a stem is a quarter note lasting one beat. An unfilled head with a stem is a half note lasting two, and an unfilled head without a stem is a whole note lasting four. Count before playing. The listening drill checks the three strings; it is not a full sight-reading exam.' },
  ],
  'bass-reading-tabs': [
    { heading: 'Four lines for four strings', body: 'Standard four-string bass tab has G on the top line, then D, A and E at the bottom. The line names identify strings, not fingers. A 0 means an open string. A 3 means press that string just behind its third fret wire.' },
    { heading: 'Read in sequence', body: 'Read events from left to right. Notes aligned vertically sound together; most first bass exercises play one note at a time. Simple tab without stems or rhythm marks does not specify every note length. Use the count or recording that accompanies it rather than guessing from spacing.' },
    { heading: 'Use the bass drill', body: 'The listening drill shows four strings and uses E1-A1-D2-G2, not six-string guitar pitches. Say the string name and fret before plucking. Choose Follow Me while learning where the notes are. On five- or six-string bass, use a suitable course or teacher rather than treating this four-line map as the whole instrument.' },
  ],
  'bass-clean-notes': [
    { heading: 'Press near the fret wire', body: 'Fret a note just behind the wire toward the headstock, with only enough pressure for a clear sound. Low bass frets are widely spaced. Shift your hand when needed; do not force a one-finger-per-fret stretch. A comfortable fingering depends on your hand and the instrument.' },
    { heading: 'Release is part of the note', body: 'To end a note, ease fretting pressure while keeping light contact with the string, or gently touch an open string with the plucking hand. Listen for a clean stop rather than an accidental open note. Keep unused strings quiet with relaxed contact.' },
    { heading: 'Practice slowly', body: 'The drill uses open and low-fret notes on E and A. Pause between targets and check that the note starts clearly. A weak phone microphone or a loud room can miss low bass notes, so a failed match is not proof of poor technique. Stop and rest if playing hurts.' },
  ],
  'bass-roots-fifths': [
    { heading: 'Follow the harmony', body: 'The root gives a chord its name: G is the root of G major and G minor. A bass line often supports a chord by returning to its root at important moments. You can play a root without strumming the guitar chord shape.' },
    { heading: 'Find a fifth', body: 'In standard E-A-D-G tuning, a perfect fifth is one string thinner and two frets higher when that string exists. G at E fret 3 pairs with D at A fret 5. A at E fret 5 pairs with E at A fret 7. Shift comfortably; do not stretch until it hurts.' },
    { heading: 'A small bass-line exercise', body: 'Use the drill to alternate the root and fifth, returning to the root. Later try one bar for each root at 60 BPM. This generic pattern is an exercise, not a licensed song backing track. Listen for note length and a steady pulse, not just correct pitch.' },
  ],
  'bass-reading-music': [
    { heading: 'The bass clef is a pitch map', body: 'The bass clef locates F on the second line from the top. Its lines from bottom to top are G-B-D-F-A; the spaces are A-C-E-G. A short extra line outside the staff is called a ledger line. The low open E in this guide needs one below the staff.' },
    { heading: 'Written and sounding octaves', body: 'Bass guitar is normally written one octave above its sound. Open E1, A1, D2 and G2 therefore appear as written E2, A2, D3 and G3. The note names still match the strings; the tuner simply reports the sounding octave. Use the guide to connect these four landmarks.' },
    { heading: 'Give each note its time', body: 'In a 4/4 exercise, count four steady beats per bar. A quarter note lasts one beat, a half note two and a whole note four. A rest has duration too. Play an open note for two beats, then mute it for two while counting. This is a listening self-check, not an automatic assessment of silence.' },
  ],
  'bass-quarter-roots': [
    { heading: 'The root is enough', body: 'A bass note can support a chord without playing the guitar shape. In G, the roots are G, C and D. On a standard four-string bass those are E-string fret 3, A-string fret 3, and A-string fret 5. Hold each one for a whole bar.' },
    { heading: 'Keep the bar line clean', body: 'Count 1-2-3-4, then mute before the next root. The drill waits in Follow Me, so use that while you learn the frets. Play in Time only after the changes feel ordinary. This is an original pattern we wrote for practice. It is not a song arrangement.' },
  ],
  'bass-box-shapes': [
    { heading: 'One shape, two chords', body: 'From a root on the E or A string, the fifth is one string thinner and two frets higher, and the octave is two strings thinner and two frets higher. G at E fret 3, D at A fret 5, and G at D fret 5 are the same shape as C at A fret 3, G at D fret 5, and C at G fret 5.' },
    { heading: 'Move the hand, do not stretch', body: 'Shift the whole hand between G and C. Stop if the reach hurts. Open the drill and play one note at a time. The pattern is a generic exercise in the public domain of music theory, not a copied bass line from a recording.' },
  ],
};
