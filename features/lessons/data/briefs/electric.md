# Electric guitar beginner path (StandardTune brief)

Implementation brief only. Do not treat this file as runtime content. Existing ids stay as-is; new ids below are proposals for a later curriculum change.

Research touchstones (do not copy exercises or prose): clean amp before distortion; fretting-hand mute of unused strings with the power shape; palm muting as a later, separate skill.

## Non-goals

- Sweep picking and multi-string arpeggio athletics
- High-gain metal tones, shred pedagogy, or drop-tuned metal as the entry path
- Seven-string (or extended-range) curricula; stay on six-string standard E–A–D–G–B–e

## Recommended order of existing ids

Mark **optional-later** for electric: do not require them after power chords.

1. `beginner-holding-the-guitar`
2. `beginner-guitar-anatomy`
3. `beginner-tuning-up`
4. `beginner-fretting-notes` — same fretting start as acoustic
5. `beginner-reading-tabs`
6. `music-pulse`
7. `music-listening`
8. `electric-setup` — clean amp, low volume, distortion off
9. **`electric-fret-mute`** *(new)* — fretting-hand mute of unused strings
10. `beginner-reading-diagrams`
11. `beginner-two-chords`
12. `beginner-basic-strumming`
13. `beginner-open-chords`
14. `music-practice`
15. `electric-power-chords` — movable root + fifth only
16. **`electric-palm-mute`** *(new)* — palm muting as a separate later skill
17. `intermediate-scales-101`
18. `intermediate-music-theory`
19. `advanced-improvisation`
20. `advanced-techniques`
21. `advanced-songwriting`

**optional-later (electric):**

- `intermediate-fingerpicking` — classical-style fingerpicking is not the next required step after power chords
- `intermediate-barre-chords` — useful later; not required to finish the electric beginner spine

## Sequencing notes

- Keep the acoustic fretting entry through first notes, then diverge: clean amp → fretting-hand mute → two-note power shapes.
- After `electric-power-chords`, continue with scales/theory or palm muting; do not insert `intermediate-fingerpicking` as required.
- Use a clean channel while learning muting and power shapes; gain comes much later, outside this beginner spine.

---

## New lesson 1: `electric-fret-mute`

| Field | Value |
| --- | --- |
| **id** | `electric-fret-mute` |
| **title** | Quiet the Unused Strings |
| **description** | Keep only the notes you fretted ringing while neighbours stay silent. |
| **minutes** | 5 |
| **outcome** | Lightly mute unused strings with the fretting hand while two intended notes sound. |
| **practice** | Form root plus fifth on frets 3 and 5. Touch the four quiet strings with spare flesh of the fretting hand. Compare a noisy strum with a controlled one. |
| **readyWhen** | You hear the two fretted notes clearly and the other four strings stay quiet without clamping. |

### Prose sections (original)

**Heading: Mute with the fretting hand**

Body: On electric guitar, open strings ring easily and a clean amp makes that noise obvious. When you play a two-string root-and-fifth shape, the other four strings should stay silent. Use spare parts of the fretting hand—often the underside of the index finger or a light touch from another finger—to damp those strings without fretting new notes. This is not palm muting; the picking hand stays free. Listen after each strike and adjust contact until only the intended pair sounds.

**Heading: Check silence before you move**

Body: Hold the same spacing and try the shape at a second fret position so the mute travels with your hand. Pluck only the two fretted strings first, then allow a gentle full-width stroke and confirm the unused strings still stay quiet. If a neighbour chirps, ease pressure on the fretted notes and increase light damp contact rather than squeezing harder. Stay on a clean, moderate volume so you can hear mistakes; distortion will hide them and tempt you to force the hand.

### Drill (six-string standard)

- **instrument:** six-string standard (omit bass `instrument` flag)
- **defaultMode:** `mono`
- **secondsPerTarget:** 8
- **intro:** Play each labeled root or fifth alone. Keep unused strings quiet with the fretting hand. The app hears pitch, not mute quality—listen yourself for silence on the other strings.
- **targets** (stringIndex 0–5, concrete frets, labels):

```
note(0, 3, 'G root · E3')
note(1, 5, 'D fifth · A5')
note(0, 3, 'G root · E3')
note(0, 5, 'A root · E5')
note(1, 7, 'E fifth · A7')
note(0, 5, 'A root · E5')
```

Two-note power shapes only (root + fifth). No song riffs.

---

## New lesson 2: `electric-palm-mute`

| Field | Value |
| --- | --- |
| **id** | `electric-palm-mute` |
| **title** | Soft Palm Edge Mute |
| **description** | Shorten notes with light palm contact after fretting-hand muting feels ordinary. |
| **minutes** | 6 |
| **outcome** | Shorten a root-and-fifth pair with light palm contact without choking the pitch flat. |
| **practice** | Play frets 3 and 5 as a pair with fretting-hand mute on unused strings. Rest the picking-hand palm edge lightly near the bridge, then release for a ringing comparison. |
| **readyWhen** | You can switch between a short muted pair and a ringing pair at an easy volume on a clean sound. |

### Prose sections (original)

**Heading: Palm mute is a later skill**

Body: Palm muting uses the side of the picking hand near the bridge to shorten sustain. Learn it only after unused strings stay quiet from the fretting hand, because both jobs at once confuse beginners. Keep amplifier gain low and the channel clean; heavy distortion turns every small contact change into mush and hides whether the fretted pitches are clear. Rest a soft edge of the palm on the strings close to the bridge, pick the two fretted notes, and lift the palm to hear the same frets ring again.

**Heading: Short versus choked**

Body: Too much palm pressure flattens pitch or kills the note entirely. Aim for a controlled thud that still shows the root and fifth, then compare with a fully ringing strike of the same shape. Move the contact point slightly toward or away from the bridge until the shortened notes stay in tune. Practice at one comfortable pulse and stop if the wrist or forearm tenses; this lesson is about deliberate length, not speed or aggressive downpicking.

### Drill (six-string standard)

- **instrument:** six-string standard
- **defaultMode:** `mono`
- **secondsPerTarget:** 8
- **intro:** Same root-and-fifth frets as before. Try a short palm-muted attack, then a ringing one. Pitch detection cannot score mute depth—judge sustain by ear.
- **targets:**

```
note(0, 3, 'G root muted · E3')
note(1, 5, 'D fifth muted · A5')
note(0, 3, 'G root ring · E3')
note(1, 5, 'D fifth ring · A5')
note(0, 5, 'A root muted · E5')
note(1, 7, 'E fifth muted · A7')
note(0, 5, 'A root ring · E5')
note(1, 7, 'E fifth ring · A7')
```

Two-note power shapes only (root + fifth). No copyrighted riffs.

---

## Implementation checklist (later; not this brief)

1. Add both lessons to `newLessons` / coaching / `FOUNDATION_CONTENT` / `DRILLS` / summaries when wiring.
2. Rebuild `paths.electric` to the recommended order; keep fingerpicking and barre off the required list (optional-later catalogue or omitted).
3. Preserve existing `electric-setup` and `electric-power-chords` copy; do not replace them with these briefs verbatim without an editorial pass.
4. Keep drills on six-string standard pitches; never invent 7-string targets here.
