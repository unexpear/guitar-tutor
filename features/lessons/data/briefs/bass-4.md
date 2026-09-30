# Four-string bass beginner path brief — StandardTune

Implementation brief only. Four-string E1–A1–D2–G2 (MIDI 28, 33, 38, 43; drill `stringIndex` 0=E, 1=A, 2=D, 3=G). Do not copy StudyBass exercises or prose. Align with Fundamentals One *order*: role and tuning → hold → pluck → fret → reading (bass clef, rhythm, tab) → practice habits → root patterns. Bass supports harmony with roots, fifths, and octaves; it does not strum guitar chords.

## Current `paths.bass` (curriculum.ts)

1. **Your first bass notes** — `bass-first-notes`, `bass-right-hand`, `bass-clean-notes`
2. **Read and keep time** — `bass-reading-tabs`, `music-pulse`, `bass-groove`, `music-listening`
3. **Build a bass line** — `bass-fretboard`, `bass-roots-fifths`, `bass-reading-music`, `music-practice`
4. **Original bass patterns** — `bass-quarter-roots`, `bass-box-shapes`

Gaps: fingers vs pick and hearing comfort are unnamed; `bass-reading-music` sits after root/fifth work; practice habits (`music-practice`) land after roots instead of before them.

## Proposed reorder (recommended path)

Keep all existing `bass-*` and shared `music-*` ids. Insert the two new lessons below. Move reading and practice habits ahead of root-pattern work.

1. **Your first bass notes** — `bass-first-notes`, **`bass-fingers-hearing`**, `bass-right-hand`, `bass-clean-notes`
2. **Read and keep time** — `bass-reading-tabs`, **`bass-reading-music`**, `music-pulse`, `bass-groove`, `music-listening`
3. **Practice habits and landmarks** — `music-practice`, `bass-fretboard`
4. **Build a bass line** — `bass-roots-fifths`, `bass-quarter-roots`, **`bass-roots-form-a`**, `bass-box-shapes`

Ordering rule for implementers: `bass-reading-music` must appear **before** `bass-roots-fifths` and `bass-quarter-roots`. `music-practice` must appear **before** those root-pattern lessons.

## Non-goals (four-string beginner path)

- Guitar chord diagrams / strummed guitar shapes as bass assignments
- Slap technique
- Five-string low B (and any required five-/six-string path); see `bass-extended.md` for optional bridge only

---

## New lesson 1 — `bass-fingers-hearing`

| Field | Value |
| --- | --- |
| **id** | `bass-fingers-hearing` |
| **title** | Fingers, Pick & Comfortable Volume |
| **description** | Choose a plucking approach and keep bass volume easy on the ears. |
| **minutes** | 5 |
| **outcome** | Name fingers vs pick, default to alternating fingers, and set a volume you can sustain without strain. |
| **practice** | Start the amp or headphone level low. Pluck open E and open A with index then middle. Optionally try one gentle pick stroke on the same strings, then return to fingers. Raise volume only until the note is clear—not until it feels “impressive.” |
| **readyWhen** | You can say whether you are using fingers or a pick, keep unused strings quiet, and play several open notes at a volume that feels comfortable for several minutes. |

### Sections (foundationContent)

1. **heading:** Fingers first, pick named  
   **body:** Most beginner bass lines start with the flesh of the index and middle fingers, alternating so one finger recovers while the other plays. A pick is a valid choice for some styles, but it is not the default on this path: name both options so you recognise them, then stay with fingers for the early drills. Aim the fingertip through the string toward the next thicker neighbour with a small motion. Keep the fretting hand free of gripping the neck; the bass should stay balanced against your body while you listen to one clear note at a time.

2. **heading:** Hearing comfort is part of technique  
   **body:** Low bass notes tempt players to turn an amplifier or headphones up until the room shakes. That habit tires the ears and hides buzz, muting mistakes, and uneven finger tone. Begin every session with the level low enough that you could hold a quiet conversation nearby, then raise it only until pitch and attack are obvious. If the phone mic clips or the room booms, lower the amp before changing your hand shape. Comfortable volume is a readiness check, not an optional courtesy—stop and reset if listening becomes uncomfortable.

### Drill

- **title:** Open E and A, Soft Attack  
- **intro:** Alternate fingers on open E and A at a comfortable volume. The app checks pitch, not finger choice or loudness.  
- **instrument:** `bass` · **defaultMode:** `mono` · **secondsPerTarget:** 8  
- **targets:**

```
note(0, 0, 'E open · i')
note(1, 0, 'A open · m')
note(0, 0, 'E open · i')
note(1, 0, 'A open · m')
```

---

## New lesson 2 — `bass-roots-form-a`

| Field | Value |
| --- | --- |
| **id** | `bass-roots-form-a` |
| **title** | Twelve Roots in A |
| **description** | Support a twelve-bar root form with one whole-note root per bar on E and A. |
| **minutes** | 7 |
| **outcome** | Play the original twelve-bar roots-only form A–E–A–E–D–A–E–A–A–E–D–A, one note per bar, naming each root. |
| **practice** | At about 60–72 BPM, hold each root for a full bar (whole note), mute cleanly at the bar line, then move to the next. Stay on the E and A strings only. Use Follow Me until the frets feel ordinary; Play in Time is optional later. |
| **readyWhen** | You can name each root as you play it, keep one note per bar through all twelve bars, and return to A without guessing the frets. |

Original exercise only — not a blues song, no lyrics, no famous lick. Bars 1–8 are the given A E A E D A E A spine; bars 9–12 close with A E D A.

### Sections (foundationContent)

1. **heading:** One root per bar is enough  
   **body:** Bass often holds the floor by playing the root of each harmony for a whole bar while other instruments fill the colour. This lesson uses only A, E and D roots—no fifths, octaves, or guitar chord boxes. On the E and A strings of a four-string bass: open E is E, open A is A, and D sits at A-string fret 5. Count four beats for every note, then mute before the next root so the bar line stays clean. The sequence is an original practice form we wrote for StandardTune; it is not an arrangement of a recorded song.

2. **heading:** Walk the twelve bars slowly  
   **body:** Play the twelve whole notes in order: A, E, A, E, D, A, E, A, then A, E, D, A. Say the root name before you pluck. Stay at a pulse you can count aloud; speed is not the goal. If a change feels late, shorten the session to the first eight bars, then add the closing four. The listening drill waits in Follow Me and checks pitch on string indices 0 and 1 only—it cannot grade silence or groove, so you judge the mute and the count yourself.

### Drill

- **title:** Twelve Roots in A (original)  
- **intro:** One whole-note root per bar on E and A strings only. Original form—not a song. Follow Me waits.  
- **instrument:** `bass` · **defaultMode:** `mono` · **secondsPerTarget:** 8  
- **targets (stringIndex 0–1 only):**

```
note(1, 0, 'A · bar 1')
note(0, 0, 'E · bar 2')
note(1, 0, 'A · bar 3')
note(0, 0, 'E · bar 4')
note(1, 5, 'D · bar 5')
note(1, 0, 'A · bar 6')
note(0, 0, 'E · bar 7')
note(1, 0, 'A · bar 8')
note(1, 0, 'A · bar 9')
note(0, 0, 'E · bar 10')
note(1, 5, 'D · bar 11')
note(1, 0, 'A · bar 12')
```

Root map: A = `note(1, 0)`, E = `note(0, 0)`, D = `note(1, 5)`. Sequence: A E A E D A E A A E D A.

---

## Implementer checklist

- [ ] Reorder `paths.bass` so reading (`bass-reading-tabs`, `bass-reading-music`, `music-pulse`, `bass-groove`, `music-listening`) and `music-practice` precede `bass-roots-fifths` / `bass-quarter-roots`
- [ ] Add `bass-fingers-hearing` and `bass-roots-form-a` to `newLessons`, summaries, foundation content, and bass drills (`stringIndex` 0–3 only; this form uses 0–1)
- [ ] Keep copy free of guitar chord diagrams, slap, and required five-string low B
- [ ] Preserve existing lesson ids and completions; only path order and additive lessons change
