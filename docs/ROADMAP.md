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
| Play-along drills | **3 drills for 11 lessons**, all beginner. The other 8 lessons are text plus an honour-system "Mark as Complete". |
| Practice tracking | `practiceGoalMinutes` is set and persisted; `totalPracticeMinutes` and `currentStreak` are declared, persisted, and **never written by anything**. The goal you set in Settings is compared against nothing. |
| Lesson scores | Stored per lesson, never displayed. The Lessons screen shows a tick and throws the number away. |
| Bass and classical | The questionnaire offers both guitar types. There are no tunings and no anatomy diagram for either; they silently fall back to acoustic. |

## Worth building, in order

### 1. Drills for the eight lessons that have none

Every lesson without a drill is a page of text with a button that claims
you learned something. The drill engine is the best code in the repo and
it is used by three lessons.

The data format is already there — `features/lessons/data/drills.ts` takes
a list of note or chord targets, an optional tempo, and a detection mode.
Adding a drill is writing a few lines of data, not writing code. The
intermediate and advanced lessons (barre chords, scales, fingerpicking)
map onto note targets almost directly.

**Effort:** small per drill, mostly content. **Value:** high — it is the
difference between a book and a teacher.

### 2. Make practice tracking real

Three persisted fields exist and nothing writes them. The pieces needed:
increment `totalPracticeMinutes` when the tuner, metronome, or a drill is
running; stamp a date so `currentStreak` can mean something; show both
against the practice goal the user already set.

This is the standard reason a learning app gets opened on day 30. It is
also the smallest amount of code on this list.

**Effort:** small. **Value:** high, and it makes an existing setting stop
lying.

### 3. Chord changes, not chords

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

### 4. Per-chord and per-song progress

`favoriteChords` now has a UI. Nothing tracks which chords a player can
actually play, or which songs they have worked on. Both are cheap to store
and would let the app answer "what should I practise today" instead of
making the user decide.

**Effort:** small to medium. **Value:** medium, rising once drills exist.

### 5. Bass and classical, or stop offering them

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
- 57 unit tests over the chord data, matcher, beat clock, fret window,
  song library, and quiz generation, running in CI.
