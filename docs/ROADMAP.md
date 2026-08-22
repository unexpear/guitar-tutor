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
| Games tab | 6 cards, **1 game**. Chord Quiz is built; the other five are still cards, now dimmed and marked "Soon" rather than pretending. |
| Play-along drills | **10 drills for 11 lessons.** Only Guitar Anatomy has none, and it has its own interactive diagram instead. |
| Practice tracking | Done. Time at the instrument is logged per day, shown against the goal, and drives a streak. |
| Lesson scores | Stored per lesson, never displayed. The Lessons screen shows a tick and throws the number away. |
| Bass and classical | The questionnaire offers both guitar types. There are no tunings and no anatomy diagram for either; they silently fall back to acoustic. |

## Worth building, in order

### 1. Chord changes, not chords

The hardest thing for a beginner is not holding a shape, it is getting
from one shape to the next in time. Nothing in the app drills that
directly.

A "chord change" drill — two chords, a metronome, count how many clean
changes per minute — is the single most effective beginner exercise there
is, and every piece needed already exists: the beat clock, the matcher's
poly mode, the chord library. The song library now knows which chords each
song uses, so this can be offered per song: *practise the two changes in
this song that you keep fluffing*.

**Effort:** medium. **Value:** high, and it is the exercise real teachers
assign.

### 2. Per-chord and per-song progress

`favoriteChords` now has a UI. Nothing tracks which chords a player can
actually play, or which songs they have worked on. Both are cheap to store
and would let the app answer "what should I practise today" instead of
making the user decide.

**Effort:** small to medium. **Value:** medium, rising once drills exist.

### 3. Bass and classical, or stop offering them

The questionnaire asks which of four instruments you play and then ignores
two of the answers. Either add tunings and an anatomy diagram for bass and
classical, or take them out of the questionnaire. The current state
promises support that does not exist.

**Effort:** small to remove, medium to support properly.

## Smaller cleanups

- `features/audio/guitarSamples.ts` — a 49-entry sample table imported by
  nothing. `useGuitarSound` has its own independent map. Delete it.
- `userPreferencesStore` exports a whole lesson-navigation API
  (`currentLessonIndex`, `nextLesson`, `previousLesson`) that no screen
  uses; the Lessons screen keeps its own local state. Delete or adopt it.
- `getGuitarTypeStrings()` in `tunings.ts` is exported and never imported.
- `getLessonScore()` is defined and never called — see "lesson scores"
  above; the fix is to use it, not to delete it.

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
- 84 unit tests over the chord data, matcher, beat clock, fret window,
  song library, and quiz generation, running in CI.
