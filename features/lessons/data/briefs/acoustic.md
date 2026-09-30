# Acoustic (steel-string) beginner path brief

Scope: StandardTune acoustic path only. Steel-string identity is a pick and a steady strum. Do not treat this path as classical fingerstyle or electric lead work.

## Current curriculum snapshot (`paths.acoustic`)

1. **Get comfortable** — `beginner-holding-the-guitar`, `beginner-guitar-anatomy`, `beginner-tuning-up`
2. **Read and play your first notes** — `beginner-fretting-notes`, `beginner-reading-tabs`, `music-pulse`, `music-listening`
3. **Make music with two chords** — `beginner-reading-diagrams`, `beginner-two-chords`, `beginner-basic-strumming`, `beginner-open-chords`, `music-practice`
4. **Build musical vocabulary** (intermediate) — `intermediate-fingerpicking`, `intermediate-scales-101`, `intermediate-music-theory`, `intermediate-barre-chords`
5. **Explore** (advanced) — `advanced-improvisation`, `advanced-techniques`, `advanced-songwriting`

## Recommended beginner order

Align with a Grade-1 style arc: hold → tune → a few open chords → pick strumming → slow changes → rhythm. Keep song-like open-chord loops before barre chords and fingerpicking.

### Beginner core (pick-and-strum first)

| Order | Lesson id | Role on acoustic |
| --- | --- | --- |
| 1 | `beginner-holding-the-guitar` | Seat the guitar; introduce pick hold for steel-string. |
| 2 | `beginner-guitar-anatomy` | Name nut, frets, bridge, tuning machines. |
| 3 | `beginner-tuning-up` | Standard six-string E A D G B e before any drill. |
| 4 | `beginner-reading-diagrams` | Read open-chord boxes before stacking shapes. |
| 5 | `beginner-two-chords` | Em ↔ Am only; clear fretting, no rush. |
| 6 | **`acoustic-pick-pulse`** *(new)* | Pick tip, downstrokes only, one chord, steady pulse. |
| 7 | `beginner-basic-strumming` | Keep pulse through a simple change; click optional. |
| 8 | `beginner-open-chords` | Add D, then G and C across sessions—not all at once. |
| 9 | **`acoustic-three-chord-loop`** *(new)* | Slow G–C–D (or G–Em–C) changes with pick downs. |
| 10 | `music-pulse` | Count beats and rests without needing new shapes. |
| 11 | `music-listening` | Higher / lower / same on one string; ear before theory. |
| 12 | `music-practice` | Short repeatable routine: tune → review → one challenge → familiar loop. |

### Supporting note skills (do not delay chords)

Keep these available early, but do **not** park the learner in single-note tab for many sessions before Em/Am and a pick pulse:

- `beginner-fretting-notes` — clear single notes, light pressure.
- `beginner-reading-tabs` — string + fret literacy for later melody work.

Suggested placement: after holding/tuning, **or** interleaved after `beginner-two-chords`, never as a multi-week gate before strumming.

### Move later (after open-chord rhythm is comfortable)

| Lesson id | When |
| --- | --- |
| `intermediate-fingerpicking` | After the learner can hold a pick pulse and change among a few open chords without stopping the count. Fingerpicking is intermediate on steel-string, not the beginner default. |
| `intermediate-barre-chords` | After fluent open shapes and at least one three-chord loop; never as a beginner milestone. |
| `intermediate-scales-101` | After rhythm with open chords feels musical. |
| `intermediate-music-theory` | After the ear can tell major/minor colour on familiar shapes. |
| Advanced unit (`advanced-*`) | Optional exploration only. |

## New beginner lessons (at most two)

### 1. `acoustic-pick-pulse`

- **id:** `acoustic-pick-pulse`
- **title:** Pick Pulse on One Chord
- **description:** Hold a pick and play even downstrokes on one open chord.
- **minutes:** 5
- **outcome:** Keep four calm downstrokes per bar on Em without chasing speed.
- **practice task:** Form Em. At a slow count, play four pick downstrokes, rest one bar, repeat. Listen for even volume across the strings you intend to hit.
- **readyWhen:** You can play several bars of even downs on Em while counting aloud; the pick does not flip or drop.
- **pitch-scorable drill:** chord names (standard open set)

#### Sections

##### Hold the pick for steel string

Steel-string beginners get their clearest sound from a short pick tip and a small wrist motion, not from large arm sweeps. Anchor the pick between thumb and index so roughly half a centimetre of tip shows past the fingers. Brush the strings with downstrokes only at first, aiming for the middle of the soundhole area. If the attack feels thin or scrapey, shorten the tip or soften the grip rather than pressing harder into the fretting hand. Keep shoulders loose and let the guitar stay balanced against your body so the picking arm is free to move in a tiny, repeatable arc.

##### One chord, four downs, then rest

Choose Em because it is already familiar from the two-chord lesson and rings with little stretch. Count “one-two-three-four” and land a downstroke on each number. After four downs, mute lightly and count a silent bar before starting again. The goal is a pulse you could nod along to, not a full song arrangement. If changes tempt you, ignore them for this session: fluency on one shape with a pick is the acoustic beginner identity, and it unlocks every later strumming drill.

#### Drill (pitch-scorable)

```
lessonId: acoustic-pick-pulse
title: Em Downs, Steady
intro: Hold Em. Strum once per target with a pick downstroke. The app checks chord-tone pitch, not pick angle—listen yourself for even volume.
defaultMode: poly
secondsPerTarget: 8
targets:
  - chord Em
  - chord Em
  - chord Em
  - chord Em
  - chord Em
  - chord Em
  - chord Em
  - chord Em
```

(No single-note string/fret list required; scoring uses open-chord names Em.)

---

### 2. `acoustic-three-chord-loop`

- **id:** `acoustic-three-chord-loop`
- **title:** Three Open Chords, Slow Loop
- **description:** Change slowly among G, C, and D with pick downstrokes.
- **minutes:** 7
- **outcome:** Complete a slow G–C–D–G loop without freezing on the fretting hand.
- **practice task:** Two bars of G, two of C, two of D, two of G again. Use only downstrokes. Stop the previous chord cleanly before forming the next.
- **readyWhen:** You can name each shape as you play it and keep a slow count through the whole loop at least twice.
- **pitch-scorable drill:** chord names G, C, D (standard open set)

#### Sections

##### Why three chords before barre or fingerstyle

A steel-string beginner path earns musical payoff from a tiny set of open shapes long before movable barre forms or classical right-hand patterns. G, C, and D cover countless simple loop ideas without asking the fretting hand for a full barre. Treat the loop as original practice material—not a published song—so you focus on clean rings and calm timing. If a change collapses, shorten to one bar per chord or return to Em and Am until the hand remembers how to release. Barre chords and fingerpicking stay later on purpose: they are expansions, not the gate to sounding like an acoustic guitarist.

##### Slow changes beat fast mistakes

Move one finger at a time when possible, and land the new shape before you strum. Count through the motion so the pick hand does not race ahead of the fretting hand. Prefer a tempo where every intended string speaks; buzzing that you can fix by rolling a fingertip closer behind the fret is useful feedback, while forcing speed only teaches panic. After two clean loops, rest your fretting hand fully open for thirty seconds. That recovery habit matters more on steel string than chasing a higher click, because fatigue makes beginners squeeze and then abandon the pick pulse they just built.

#### Drill (pitch-scorable)

```
lessonId: acoustic-three-chord-loop
title: G C D Loop
intro: Form each open chord, then one pick downstroke per target. Full-chord listening helps, but also check strings by ear. Original practice loop—not a song arrangement.
defaultMode: poly
secondsPerTarget: 10
targets:
  - chord G
  - chord C
  - chord D
  - chord G
  - chord C
  - chord D
  - chord G
```

## What must NOT be taught as acoustic beginner

- **Classical rest-stroke (apoyando)** and nylon-string posture as the default setup — that belongs on the classical path (`classical-posture`, `classical-first-touch`), not steel-string Grade-1 style.
- **Distortion, gain stacking, or amp-driven dirty tones** — electric path material; acoustic beginners need a clear unplugged or clean acoustic sound.
- **Banjo-style rolls and right-hand roll patterns** sold as “acoustic beginner technique” — they are a different instrument tradition and crowd out pick-strum fundamentals.
- **Barre chords as a first-month requirement** — keep `intermediate-barre-chords` after open-chord rhythm.
- **Fingerpicking as the primary beginner right hand** — keep `intermediate-fingerpicking` after pick pulse and open-chord changes.
- **Copyrighted songs, lyrics, or method-book exercises** — use original loops and chord-name drills only (Em, Am, G, C, D, A, E).

## Implementation notes (for later; this brief does not edit source)

- Wire `acoustic-pick-pulse` and `acoustic-three-chord-loop` into `paths.acoustic` between two-chords / basic strumming and open-chords / practice as in the order table.
- Reorder intermediate unit so fingerpicking and barre remain post-beginner; prefer scales/theory only after the three-chord loop.
- Prefer chord-target drills (`Em`, `Am`, `G`, `C`, `D`, `A`, `E`) for these lessons; if a note drill is ever added, use six-string standard tuning indices `0` = low E … `5` = high e with explicit fret and label.
