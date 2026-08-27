# What StandardTune could add next

A survey of the app as it stands, and where the value is. Written from a
read of the whole source tree, so everything here is grounded in what the
code actually does rather than what the tabs imply.

The app has one genuinely strong asset: a native pitch-detection pipeline
wired to a hardened matcher that can tell whether you played the right
thing. Almost nothing else in the app uses it. That is the theme of this
document — most of the highest-value work is connecting existing parts to
each other, not building new ones.

## Where the app is thin

| Area | State |
|---|---|
| Games tab | 7 cards, **2 games**. Chord Quiz and Chord Changes are built; the other five are dimmed and marked "Soon" rather than pretending. |
| Play-along drills | **11 drills for 11 lessons.** Every lesson that can support a drill has one: the holding, tuning-up and reading-diagrams lessons are at-your-own-pace reading, and Guitar Anatomy has its own interactive diagram instead. |
| Practice tracking | Done. Time at the instrument is logged per day, shown against the goal, and drives a streak. |
| Lesson scores | Shown on the card when a drill produced them. |
| Bass | Withdrawn from the questionnaire until it can be supported properly — see below. |

## Worth building, in order

### 1. Bass, properly

Bass used to be one of four answers in the questionnaire and then changed
nothing: the app would hand a bassist a six-string tuner asking for E2 to
E4, when a bass is four strings from E1 to G2. It is withdrawn for now, and
anyone who had picked it is moved to electric.

Supporting it for real is a genuine feature, not a toggle: string counts
are assumed to be six in the tuner UI, the headstock SVG and the tunings
data, the pitch floor needs to reach E1 at about 41 Hz, and the chord
library does not apply at all. Worth doing, but as its own piece of work.

**Effort:** medium. **Value:** medium — it opens the app to a new
instrument, but every existing feature needs a bass-shaped answer first.

## Smaller cleanups

All done: the dead 49-entry sample table, the unused lesson-navigation API,
and `getGuitarTypeStrings()` are deleted, and `getLessonScore()` is now
used rather than merely defined.

## Deliberately not doing

- **Song tabs and lyrics.** Which chords a song uses is a fact about the
  song. A bar-by-bar transcription or the lyrics are the copyrighted work
  itself. The song sheets stay a chord reference for that reason, and the
  fine print in the sheet says so.
- **Accounts, sync, analytics.** The privacy position — nothing recorded,
  nothing transmitted, no tracking — is a feature, and it is what the Play
  Data Safety declaration says. Anything that changes it has to change
  `PRIVACY.md` and the Data Safety form first.

## Recently done

For context on what has just landed, so this list is not re-proposing it:

- Chord diagrams draw barres as a single bar, and slide their window up
  the neck with a position label, so shapes above the fifth fret can be
  shown at all. Seven barre chords added (F#, Ab, Bb, Eb, F#m, G#m, C#m).
- The strumming drill runs to a click track with a count-in and grades
  each strum against the beat, on a shared drift-corrected clock that
  resyncs rather than firing missed beats in a burst.
- Chords play when tapped, and can be favourited.
- The tuning chosen in Settings actually reaches the Tuner.
- Songs list the chords they need, with diagrams you can hear.
- **Chord Quiz**, the Games tab's first real game. Three question types —
  name the shape, pick the shape, name what you hear — over ten questions,
  with a streak bonus and a persisted high score. The work that mattered
  was the wrong answers: four chords drawn at random are trivial, so
  distractors are chosen from the same root and the most hand-similar
  shapes. Asking someone to identify G7 next to G, B7 and Cmaj7 is a real
  question; next to Bdim it is not. The other five cards are now dimmed
  and labelled "Soon" instead of all showing the same alert.
- A drill for every lesson that can have one. Seven new ones, written to
  the exercise each lesson already prescribes rather than invented: the
  barre drill runs in full-chord mode because the point is whether every
  string rings, the fingerpicking drill is the lesson's own p-i-m-a-m-i at
  the 50 BPM it asks for, and the scale drills are checked by tests that
  assert the notes really spell C major and A minor pentatonic.
- Practice tracking that exists. The tuner listening, the metronome
  running and a drill in progress all count time against today; the
  Lessons screen and Settings show it against the goal, and a streak that
  has lapsed reads as zero rather than flattering you with a stale number.
  The date arithmetic is a pure module with tests over local-midnight
  boundaries, daylight saving, leap day, and a clock that goes backwards.
- The gear on the Lessons screen opened the questionnaire and wiped your
  answers on one stray tap. It opens Settings now, and the labelled
  Retake button in Settings asks first.
- **Chord Changes**: the one-minute-changes exercise, which is the single
  most useful thing a beginner can drill, because the hard part of chords
  was never holding one. Pick two chords, play for a minute, and it counts
  the changes off the live pitch stream. It defaults to full-chord
  detection so a muted change does not score, and keeps a best per pair.
  A song's sheet has a "Drill G ↔ D" button that opens it prefilled with
  the two chords that song opens on.
- Dead code removed (a 49-entry sample table nothing imported, an unused
  lesson-navigation API, an unused tuning helper), lesson scores shown
  where they were previously stored and discarded, and Bass withdrawn from
  the questionnaire rather than left as an answer that changed nothing.
- Per-chord progress. Every judged attempt — a quiz answer, a drill target
  hit or missed, a change that landed — is recorded against that chord, and
  the chord sheet says whether it is solid, shaky, or not practised yet. A
  "Needs work" filter collects the ones under 75%. Merely looking at a
  diagram does not count, or every chord you browsed would read as
  mastered, and fewer than four attempts reads as "learning" rather than
  convicting you on one bad guess.
- An audit pass for errors and holes: the tuner used to swallow mic errors
  (a denied permission left the main button silently dead), nothing
  released the mic when you left a screen, and Chord Quiz served silent
  listening questions when sounds were off. Favourites, longest streak,
  total practice time and song genre were all stored and never shown.
- 106 unit tests over the chord data, matcher, beat clock, fret window,
  song library, and quiz generation, running in CI.
