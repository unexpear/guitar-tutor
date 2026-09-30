# One instrument, one learning path

Research and implementation review: 2026-09-19. This is a guided introductory curriculum, not an accredited syllabus or a claim of teacher-certified mastery.

## Findings and plan

The previous Learn tab exposed the same 19 lessons to everyone: 15 guitar lessons plus four bass lessons. The saved guitar choice mainly affected anatomy. Progress counted unrelated completions, and the practice view assumed six-string guitar pitches. Bass prose also sent learners to guitar-only games and described a recording feature that does not exist.

The selected approach is a persistent learning instrument, a recommended sequence of small units, one visible next step, and an explicit task/readiness check. Nothing is level-locked. Existing lesson IDs, earned XP, cosmetics and completions stay intact. Switching paths can carry shared foundations forward without counting unrelated lessons.

## Research and design decisions

- [Fender Play: My Path](https://play-instructor.fender.com/hc/en-us/articles/12716412478605-My-Path) uses instrument-specific paths that introduce technique and theory gradually and apply skills musically. Adopt the visible instrument choice and next-step structure, not Fender's content or assets.
- [JustinGuitar: Beginner Grade One](https://www.justinguitar.com/classes/beginner-guitar-course-grade-one) combines first chords, rhythm, changes, riffs and consolidation. Our application starts with small note and two-chord tasks instead of treating a large chord catalogue as a lesson. This is our sequencing decision, not a reproduction of Justin's exact course.
- [StudyBass: Fundamentals One](https://www.studybass.com/study-guide/studybass-fundamentals-one/) covers bass's musical role, technique, notation, theory and practice habits. Bass therefore gets four-string tab, plucking/muting, rests, roots/fifths and bass-clef landmarks instead of guitar strumming requirements.
- [This is Classical Guitar: beginner method overview](https://www.thisisclassicalguitar.com/free-classical-guitar-method-book-pdf/) and its [stroke lesson](https://www.thisisclassicalguitar.com/lesson-rest-or-free-stroke/) support a distinct classical entry: balanced posture, fingerstyle touch, simple notes and reading. Chord accompaniment comes later in our path.
- [StudyBass: octaves](https://www.studybass.com/lessons/common-bass-patterns/octaves/) and [Fender: power chords](https://www.fender.com/articles/chords/what-is-a-power-chord) were used to cross-check interval patterns. Tests verify the actual sounding pitches and staff positions independently of prose.

These sources are references, not endorsements. Free access does not grant permission to redistribute their books, audio, videos or exercises. New instructional text is original; no source recordings, song arrangements or PDF pages were copied into the app. Generic note/chord exercises are labeled as exercises, not songs.

## Implemented paths

32 distinct lessons total, including 13 new lessons. Shared lessons appear in more than one path; the path counts must not be added to obtain the catalogue count.

| Choice | Lessons | Focus |
| --- | ---: | --- |
| Acoustic guitar | 21 | Setup, diagrams, Em/Am, pick downstrokes, open-chord changes, a slow G–C–D loop, then notes and later fingerpicking |
| Electric guitar | 21 | Guitar foundations plus clean amplification, muting and root/fifth power shapes |
| Classical guitar | 18 | Posture, free stroke, rest stroke, a short treble melody, then accompaniment. Barre is not on this path |
| Four-string bass | 15 | Fingers and volume, tab and bass clef, then roots, fifths and an original twelve-bar root form |

The other instruments in the tuner are not advertised as having complete lesson paths. Five-/six-string bass and alternate-tuning lesson curricula are outside this change.

## Learner experience

1. Choose an instrument in onboarding, or use **Learn → Change learning instrument**.
2. **Tune for this path** explicitly selects the appropriate standard tuning. Merely browsing another path does not overwrite the saved tuner preset.
3. Start with the next incomplete lesson. Any other unit can be opened freely.
4. Read the aim, try the short practice task, and use the readiness check. The suggested minutes describe a short session, not a mastery deadline.
5. Use a listening drill where provided, or self-mark a practised lesson. Repeat without losing a best score or earning duplicate first-completion XP.

Legacy preferences restore the corresponding guitar path. The separate learning preference supports bass without changing the guitar anatomy component's supported types. Settings displays the chosen learning instrument. Shared completions carry over; unrelated and obsolete IDs do not inflate a path's progress.

## Assessment and musical correctness

- Bass drill targets use four sounding open pitches: MIDI 28, 33, 38 and 43. The microphone configuration uses the existing bass frequency range, not the guitar range. Tab displays G–D–A–E from top to bottom.
- Guitar matching stays backward-compatible. Shared games and songs retain their previous guitar defaults.
- Staff primers distinguish sounding octaves from conventional octave-transposing guitar/bass notation. Treble open G/B/e is written G4/B4/E5; bass open E/A/D/G is written E2/A2/D3/G3.
- Pitch recognition cannot confirm the fretting finger, posture, muting quality, every chord string or the quality of a rest. The instructions explicitly separate detector feedback from those listening/self-observation checks.
- Comfortable movement, hand shifts, pauses and stopping when playing hurts replace pressure to force a stretch or push through discomfort. No score or streak requires painful practice.
- No new recorded backing tracks, videos, recording feature or automatic rhythm/rest-grading capability is claimed.

## Technical sources

Checked the required [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/), the installed pitch engine and tuner profiles, [Zustand persistence/merge behavior](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data), and React Native's [Modal](https://reactnative.dev/docs/modal) and [BackHandler](https://reactnative.dev/docs/backhandler) contracts. The new preference is additive; a custom merge restores old choices without resetting progress. Lesson modals handle Android back; interactive lesson screens handle it only while focused.

## Verification and remaining boundaries

- All 354 automated tests passed, including catalogue reachability, prose, readiness tasks, instrument separation, legacy migration, persistence, shared progress, bass tuning/matcher agreement and staff-note geometry.
- Browser checks use the actual screen components with isolated test storage and simulated native services: path switching/reload, first-use bass Quick Start, self-completion/next step, the tuning shortcut, four-line bass practice, staff/chord guides and large-text layouts. These do not verify real microphone capture.
- Type checking and Android bundle export passed. No dependency or audio-asset additions are needed.
- Physical-device microphone checks with an actual bass and guitar remain necessary. Browser simulation and exact-frequency unit tests cannot prove acoustic performance in a room.
- Future curriculum work should add teacher/novice observation sessions. Original CC0 bass patterns are in Learn and in Songs when the learning instrument is bass. Do not imply that introductory staff landmarks alone are a complete sight-reading course, or that an existing guitar song chart is automatically a bass arrangement.
- This work does not publish a release.
