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
  'acoustic-pick-pulse': [
    { heading: 'Hold the pick for steel string', body: 'A short pick tip and a small wrist motion give a clearer steel-string sound than a large arm sweep. Show about half a centimetre of tip past your thumb and index finger. Brush downstrokes toward the soundhole. If the attack feels thin, shorten the tip or soften the grip instead of squeezing the fretting hand.' },
    { heading: 'One chord, four downs, then rest', body: 'Use Em from the two-chord lesson. Count one-two-three-four and land a downstroke on each number, then mute and count a silent bar. The app cannot score repeated strums of the same chord, so the drill checks each Em string once. Listen for even volume on the downstrokes yourself.' },
  ],
  'acoustic-three-chord-loop': [
    { heading: 'Three chords before barre or fingerstyle', body: 'G, C, and D let you loop musical ideas without a barre or a classical right hand. Treat this as original practice, not a published song. If a change collapses, use one bar per chord or return to Em and Am. Fingerpicking and barre shapes stay later on this path.' },
    { heading: 'Slow changes beat fast mistakes', body: 'Land the new shape before you strum, and count through the motion so the pick does not race ahead. Prefer a tempo where the strings you mean to play can speak. After two clean loops, open the fretting hand and rest. Then try the drill, one chord at a time.' },
  ],
  'bass-quarter-roots': [
    { heading: 'The root is enough', body: 'A bass note can support a chord without playing the guitar shape. In G, the roots are G, C and D. On a standard four-string bass those are E-string fret 3, A-string fret 3, and A-string fret 5. Hold each one for a whole bar.' },
    { heading: 'Keep the bar line clean', body: 'Count 1-2-3-4, then mute before the next root. The drill waits in Follow Me, so use that while you learn the frets. Play in Time only after the changes feel ordinary. This is an original pattern we wrote for practice. It is not a song arrangement.' },
  ],
  'bass-box-shapes': [
    { heading: 'One shape, two chords', body: 'From a root on the E or A string, the fifth is one string thinner and two frets higher, and the octave is two strings thinner and two frets higher. G at E fret 3, D at A fret 5, and G at D fret 5 are the same shape as C at A fret 3, G at D fret 5, and C at G fret 5.' },
    { heading: 'Move the hand, do not stretch', body: 'Shift the whole hand between G and C. Stop if the reach hurts. Open the drill and play one note at a time. The pattern is a generic exercise, not a copied bass line from a recording.' },
  ],
  'electric-fret-mute': [
    { heading: 'Mute with the fretting hand', body: 'A clean amp makes open-string noise obvious. For a root and fifth, damp the other strings with spare flesh of the fretting hand. This is not palm muting. Listen after each note and lighten the fretting pressure if a neighbour chirps.' },
    { heading: 'Check silence before you move', body: 'Try the same spacing at a second fret so the mute travels with the hand. The drill checks pitch only, so you judge the quiet strings yourself. Stay on a clean sound. Distortion hides the mistakes this lesson is for.' },
  ],
  'electric-palm-mute': [
    { heading: 'Palm mute comes later', body: 'Rest the side of the picking hand near the bridge only after unused strings already stay quiet. Keep the amp clean and the gain low. Compare a shortened note with the same frets ringing.' },
    { heading: 'Short versus choked', body: 'Too much palm pressure flattens the pitch. Aim for a controlled thud that is still the right note, then lift the palm. Stop if the wrist tenses. The drill cannot score how short the note was.' },
  ],
  'classical-rest-stroke': [
    { heading: 'What a rest stroke does', body: 'A rest stroke plucks one string and finishes on the next thicker neighbour. On open G the finger lands on B. Keep the motion small and use i and m. Leave the thumb quiet.' },
    { heading: 'Open treble only', body: 'Stay on open G, B and high e so a new pluck does not fight a new fret. The drill checks pitch, not whether the finger landed. You confirm the rest by feel and by a solid tone.' },
  ],
  'classical-treble-melody': [
    { heading: 'One phrase, three strings', body: 'The phrase uses only G, B and high e, frets 0 to 3. It is an original line, not a folk song. Press just behind the fret and release when the next note is open.' },
    { heading: 'Sound first', body: 'Use one plucking approach for the whole pass. The drill waits for each note. Matching pitch does not judge tone. When it feels familiar, play it once more and stop while it is still clear.' },
  ],
  'bass-fingers-hearing': [
    { heading: 'Fingers first, pick named', body: 'Alternate index and middle as the default. A pick is a real option, but this path stays with fingers for the early drills. Keep the bass balanced so the fretting hand is not holding the neck up.' },
    { heading: 'Hearing comfort', body: 'Start with the amp or headphones low enough for a quiet conversation, then raise the level only until the note is clear. If it booms, turn down before you change your hand. The drill checks pitch, not loudness.' },
  ],
  'bass-roots-form-a': [
    { heading: 'One root per bar', body: 'This original form uses only A, E and D roots on the E and A strings. Open E is E, open A is A, and D is A-string fret 5. It is not an arrangement of a recording. Count four beats, then mute.' },
    { heading: 'Twelve bars, one repeated A', body: 'The written order is A E A E D A E A, then another A, then E D A. The drill skips that second A because a still-ringing note would satisfy the next identical target. Count that extra bar yourself.' },
  ],
  'bass-low-b': [
    { heading: 'Find B, then leave it quiet', body: 'Five-string bass adds B0 beside E. Learn E A D G first. Pluck B once so you know the string, then mute it while you play the four familiar strings. This is a self-check. The app does not score low B.' },
    { heading: 'Not a new path', body: 'Muting the extra string is the skill. Do not start here. Finish the four-string lessons first. Guitar chord charts are still the wrong picture of a bass line.' },
  ],
  'bass-high-c': [
    { heading: 'Find high C', body: 'Six-string bass adds a high C above G. Pluck it once, then mute it and return to G. The thin string rattles if your fretting hand forgets it. This lesson is self-check only.' },
    { heading: 'After the lower strings', body: 'Finish four-string work, and the low-B mute if you have that string, before you rely on high C. The scored drills stay on E A D G.' },
  ],
  'guitar-baritone-range': [
    { heading: 'Same shapes, lower names', body: 'Baritone B standard sits about a fourth below regular guitar. Finish a six-string path first. The fretting patterns you know still work. You are checking the new open-string names, not learning a new chord book.' },
    { heading: 'Self-check', body: 'Tune with the baritone profile and play one familiar shape slowly. The app does not add a new scored catalogue for this bridge.' },
  ],
  'guitar-7-mute': [
    { heading: 'One extra low string', body: 'After the six-string path, find open low B on a seven-string. Then play open low E while B stays silent. The new skill is muting, not a new set of chords.' },
    { heading: 'Self-check', body: 'Listen for B ringing when you did not pick it. This bridge is not a beginner syllabus and it is not scored.' },
  ],
  'guitar-8-mute': [
    { heading: 'Two extra low strings', body: 'Eight-string adds F-sharp and B below E. Sound each once, then mute both and play open E. Finish six-string work first.' },
    { heading: 'Self-check', body: 'If either low string speaks during an ordinary note, stop and reset the mute. No new chord catalogue.' },
  ],
  'guitar-12-courses': [
    { heading: 'Pairs, not twelve melodies', body: 'A twelve-string is six courses. It is a poor first instrument because the pairs slip. Finish six-string playing first. Use a lighter touch than you would on one string.' },
    { heading: 'Retune often', body: 'Brush one course and listen for the octave string. Retune before the pair sours. This is a self-check, not a new songbook.' },
  ],
  'uke-hold-tune': [
    { heading: 'Four strings, not six', body: 'Balance the ukulele so the fretting hand is free. Standard beginner tuning is re-entrant high G, then C, E, A. Low G changes the melody string. Baritone ukulele is D G B E and is not a guitar chart.' },
    { heading: 'Tune, then stop', body: 'Use the ukulele tuner profile. Name each string as you tune it. There is no scored drill. Guitar chord boxes will teach the wrong shapes.' },
  ],
  'uke-two-chord-strum': [
    { heading: 'Two ukulele shapes', body: 'On high-G tuning, learn the ukulele’s own C and G7, described for four strings, and strum slow downs. On baritone, use a I and V idea in that tuning. Do not copy a six-string guitar diagram.' },
    { heading: 'Soft downs', body: 'Change only when the next shape is down. The drill listens for high-G ukulele C and G7. It does not judge the size of the strum or accept a guitar chord shape.' },
  ],
  'uke-open-pluck': [
    { heading: 'Open strings only', body: 'Pluck G, C, E, A and back. It is an original order, not a song. Even tone matters more than speed.' },
    { heading: 'Tab can wait', body: 'Four-line tab comes after you can find the open strings. The drill checks those open pitches. It does not grade tone.' },
  ],
  'mandolin-tune-courses': [
    { heading: 'Fifths and pairs', body: 'Mandolin courses are G, D, A and E, each a pair, tuned in fifths. That is not guitar fourths. Tune each pair until both strings agree.' },
    { heading: 'Self-check', body: 'Use the mandolin tuner. Name each course. No scored drill and no fiddle tune.' },
  ],
  'mandolin-clean-course': [
    { heading: 'Both strings of one course', body: 'One pick stroke should cross both strings of the open G course. If one is dull, adjust the pick. Keep the other courses quiet.' },
    { heading: 'Self-check', body: 'Listen for a matched pair. The drill accepts the course pitch. It cannot tell whether both strings of the pair spoke. Guitar chord shapes will not fit these intervals.' },
  ],
  'mandolin-open-fifth': [
    { heading: 'A fifth, then a fret', body: 'Play open G then open D. That is a fifth. Then fret both strings of one course at the second fret and listen for a clear pair.' },
    { heading: 'Self-check', body: 'The drill checks the fifth and the fretted course by pitch. Do not import a guitar power-chord shape.' },
  ],
  'banjo-open-g-fifth': [
    { heading: 'The short string is a drone', body: 'Open G is g D G B D. The fifth string is the short high G nearest you. It is not a guitar low E. Clawhammer uses a different right hand and is not this path.' },
    { heading: 'Self-check', body: 'Tune with the banjo profile and point to the fifth string. No scored drill.' },
  ],
  'banjo-strum-g': [
    { heading: 'Open G is the chord', body: 'A slow downstroke on the open strings is already G. C and D7 can wait. Listen for a chord, not a scrape.' },
    { heading: 'Self-check', body: 'Keep the roll for the next lesson. This one is only the strum.' },
  ],
  'banjo-eight-forward': [
    { heading: 'Thumb, index, middle', body: 'At about 60 BPM, play an eight-note roll with thumb, index and middle on the long strings. It is an original pattern, not a copied lick.' },
    { heading: 'Self-check', body: 'Say the finger for each note. The drill hears the open-string pitches of the roll. It does not know which finger you used.' },
  ],
  'violin-rest-play': [
    { heading: 'Rest, then play', body: 'Move from rest position to playing position before any bowing. The left hand must not hold the violin up. There are no frets and no guitar tab.' },
    { heading: 'Self-check', body: 'The app does not grade posture. Stop if the shoulder hikes.' },
  ],
  'violin-bow-open': [
    { heading: 'Bow, then one string', body: 'Settle a soft bow hold and play four quarter notes on one open string. Fingered notes come later.' },
    { heading: 'Not graded', body: 'The drill accepts open A, D, and E. It does not grade bow direction or tone. Repeated quarters on one string stay in your own count.' },
  ],
  'violin-open-listen': [
    { heading: 'Sharp or flat', body: 'Pluck or bow one open string and read the violin tuner before you move the peg. Decide whether the pitch must rise or fall.' },
    { heading: 'Open strings only', body: 'Open the drill and play each open string in tune. Fingered intonation is a teacher’s job. This lesson stops at the open string.' },
  ],
  'viola-hold': [
    { heading: 'Larger than a violin', body: 'Balance the viola sitting or standing so neither hand props it up. Do not reuse a violin fingering chart. Tuning is C G D A.' },
    { heading: 'Self-check', body: 'The scroll should stay up without a gripped neck.' },
  ],
  'viola-bow-open-cg': [
    { heading: 'Lowest two strings', body: 'Draw separate bows on open C, then open G. No left-hand fingers yet.' },
    { heading: 'Not graded', body: 'The drill accepts open C and G. It does not grade the bow. Listen for one string at a time.' },
  ],
  'viola-alto-landmarks': [
    { heading: 'Alto clef', body: 'Open strings from low to high are C, G, D and A, read in alto clef. They are not the violin’s G D A E and not treble-clef guitar notes.' },
    { heading: 'Names only', body: 'Say the four names. This is not a copied staff exercise and it is not scored.' },
  ],
  'cello-endpin-sit': [
    { heading: 'Sit, do not stand', body: 'Set the endpin so the cello stands while both hands come off the neck. This is not violin posture.' },
    { heading: 'Self-check', body: 'If the instrument falls when you let go, lengthen or shorten the endpin before you play.' },
  ],
  'cello-bow-open-gd': [
    { heading: 'A heavier bow', body: 'The cello bow hold is not the violin hold with the pinky on top. Draw separate quarter-note bows on open G and open D.' },
    { heading: 'Not thumb position', body: 'Thumb position and tenor clef are later skills. The drill checks open G and D. It does not grade the bow.' },
  ],
  'cello-first-position': [
    { heading: 'First position only', body: 'Place the left hand in first position and walk a few original notes on G and D. Do not use an exam piece.' },
    { heading: 'Bow still ungraded', body: 'The drill can hear open G and D. You judge the bow. Fingered cello intonation is not scored.' },
  ],
};
