# Beginner bridge: five- and six-string bass (StandardTune)

## Scope (not a path)

Tuner profiles `bass-5` and `bass-6` already exist. Learn already ships a **four-string** bass path on E1–A1–D2–G2. This brief specifies **at most two** optional, short, **self-check** lessons that bridge a learner who already has that foundation onto an extra low B or high C string.

These two lessons are **not** a full five- or six-string curriculum, **not** a new harmony system, and **must not** be inserted into the four-string bass path as required steps, unit gates, or progress prerequisites. They may appear only as optional extras (or stay out of the catalogue until product chooses to surface them). Do **not** reuse guitar charts, six-string guitar drills, or guitar song arrangements as bass material.

**Prerequisite:** complete (or comfortably self-manage) the existing four-string work: tune and play E–A–D–G, alternate plucking fingers, and mute unused strings on those four. Standard order remains: learn the middle four first; then add the outer string.

**Scoring limit:** the app can pitch-score only four-string bass targets today (string indices 0–3 = E1, A1, D2, G2). New lessons must be **SELF-CHECK prose** with ear and hand observation. Do not attach a fake microphone drill, guitar-string map, or B0/C3 scored target that pretends the matcher supports the extra string.

**Tunings (reference only):**

| Profile | Open strings (low → high) |
| --- | --- |
| Four-string (existing path) | E1 A1 D2 G2 |
| `bass-5` | **B0** E1 A1 D2 G2 |
| `bass-6` | **B0** E1 A1 D2 G2 **C3** |

The new beginner skill on both instruments is **keeping the extra string quiet** when it should not sound—not learning a different chord vocabulary.

---

## Lesson `bass-low-b`

| Field | Content |
| --- | --- |
| **id** | `bass-low-b` |
| **title** | Low B and Quiet Neighbours |
| **description** | On five-string (or six-string) standard bass, find open B0 beside E, then keep that string silent while you play the familiar E–A–D–G notes. Self-check only—no scored drill. |
| **minutes** | 6 |
| **outcome** | Identify open low B by ear next to open E, and deliberately mute B0 while playing clear notes on the four standard strings. |
| **practice** | In Tune, select five-string (or six-string) standard. Pluck open B0 once and let it settle; compare it to open E1. Then play open E, A, D, and G in turn while resting the fretting hand or thumb so B0 stays silent. Repeat slowly; judge silence yourself—the app will not score B0 or muting. |
| **readyWhen** | You can name open B as lower than open E, and you hear no sustained B drone when you play a short E–A–D–G sequence on purpose. |

### Sections

#### Find B0 beside the four you know

Five-string standard adds one thicker string tuned to sounding B0 below the E you already use. Sit as you do for four-string work. In the tuner, choose the five-string (or six-string) bass profile so the lowest reference is B0, not E1. Pluck the lowest string once with a small motion and listen for a pitch clearly below open E. If the phone jumps octaves, mute every other string, move closer to a quiet amp or the instrument body, and try again. Do not treat four-line tab or a four-string listening drill as a map of this fifth string; those tools still describe only E–A–D–G. Your job here is one landmark: open B0 next to open E1, confirmed by your ear and the tuner needle, not by a lesson pitch score.

#### Mute the extra string on purpose

The musical job on day one is not a new scale system—it is silence where B should not ring. Play the open E–A–D–G sequence you already know, one note at a time. Before each pluck, check that the lowest string is stopped: a light fretting-hand touch across B0, or a resting thumb/palm that keeps it from vibrating, is enough. Count a short rest after each note and listen for a leftover low hum. If B sings along, stop, mute, and restart that note. This is a listening self-check. StandardTune’s bass drills still listen only on string indices 0–3; they cannot certify that B0 stayed quiet. Mark the lesson practised when *you* hear clean four-string notes without a B drone—not when a detector lights green.

---

## Lesson `bass-high-c`

| Field | Content |
| --- | --- |
| **id** | `bass-high-c` |
| **title** | High C Without the Rattle |
| **description** | On six-string standard bass, find open high C above G, then keep that thin string mute while you return to E–A–D–G lines. Self-check only—no scored drill. |
| **minutes** | 6 |
| **outcome** | Identify open high C by ear above open G, and keep C3 silent while playing clear notes on the four standard strings (and on low B only if you already use five-/six-string muting from `bass-low-b`). |
| **practice** | In Tune, select six-string standard. Pluck open C3 once; compare it to open G2. Then play open E, A, D, and G while lightly touching the highest string so it does not ring. Optional: add one open B0 note, then return to E, still muting C. Judge ringing yourself—the app will not score C3 or muting. |
| **readyWhen** | You can tell open C is higher than open G, and a short E–A–D–G phrase does not leave a thin C buzz or sympathetic ring. |

### Sections

#### Find C3 above the four you know

Six-string standard keeps the five-string layout and adds one thinner string tuned to sounding C3 above the open G you already use. Use the six-string bass tuner profile. Pluck the highest string once and listen for a pitch clearly above open G. Keep volume comfortable; a bright open C can sound louder than the middle strings even when the motion is small. Compare C3 and G2 a few times until the higher one is obvious. Do not import guitar high-e charts, six-line guitar tab, or guitar practice drills: those string indexes and pitches are a different instrument. Four-string bass lessons and drills remain the place to practise E–A–D–G pitch targets. This lesson only adds one outer landmark—open C3—confirmed by tuner and ear.

#### Mute the thin string while the groove stays on four

When the line lives on E–A–D–G, the high C string is usually cargo, not melody. Play a slow open E–A–D–G sequence. Between notes, rest a fretting fingertip or the side of a plucking finger against the highest string so it cannot speak. Listen for a thin after-ring or a metallic rattle against a fretting finger. If you hear it, mute, breathe, and replay that beat. If your bass also has low B, keep applying the quiet-neighbour habit from the low-B bridge; still do not expect the app to score B0 or C3. Optional self-check only: pluck open C once to confirm the landmark, mute it fully, then resume the four-string phrase. Ready means *your* ears hear the middle four without a high-C ghost—not a microphone pass on an unsupported string.

---

## Implementation notes (for later; this file is the only deliverable)

- Ship as optional / non-required content relative to `bass-path` and the four-string learning instrument sequence.
- No new drills, no guitar chart reuse, no claim that Learn fully covers five- or six-string bass.
- Copy must say **self-check** and state that pitch scoring remains four-string-only until the product adds real B0/C3 targets.
