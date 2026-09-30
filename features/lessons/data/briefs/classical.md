# Classical (nylon) path brief — StandardTune beginner deepen

Implementation brief only. Do not copy graded-syllabus pieces, scale lists, or exam prose. Aligns with common early classical sequencing (seated balance → free/rest stroke → first-position melody → short pieces → scales; chords after a simple melody; staff reading as a few landmarks, not sight-reading fluency).

## Current `paths.classical` (curriculum.ts)

1. **Balance and first sounds** — `classical-posture`, `beginner-guitar-anatomy`, `beginner-tuning-up`, `classical-first-touch`
2. **Read, listen and play** — `music-pulse`, `classical-reading-music`, `beginner-fretting-notes`, `beginner-reading-tabs`, `music-listening`
3. **Melody and accompaniment** — `beginner-reading-diagrams`, `beginner-two-chords`, `beginner-open-chords`, `music-practice`
4. **Develop your musicianship** — `intermediate-fingerpicking`, `intermediate-scales-101`, `intermediate-music-theory`, `intermediate-barre-chords`

Gap: unit 3 jumps to Em/Am and open chords before any rest stroke or short first-position melody. Free stroke is introduced in `classical-first-touch`; rest stroke is only mentioned, not practised. Barre sits on the recommended intermediate unit though it is not an early classical requirement.

## Proposed reorder (recommended path)

Keep shared foundations. Insert the two new lessons below. Move accompaniment after melody.

1. **Balance and first sounds** — `classical-posture`, `beginner-guitar-anatomy`, `beginner-tuning-up`, `classical-first-touch`, **`classical-rest-stroke`**
2. **Read, listen and play** — `music-pulse`, `classical-reading-music`, `beginner-fretting-notes`, `beginner-reading-tabs`, `music-listening`
3. **A short melody first** — **`classical-treble-melody`**, then `beginner-reading-diagrams`, `music-practice` (optional early practice habit before chords)
4. **Simple accompaniment** — `beginner-two-chords`, `beginner-open-chords` (no pick strumming lesson)
5. **Develop your musicianship** — `intermediate-fingerpicking`, `intermediate-scales-101`, `intermediate-music-theory` — **drop `intermediate-barre-chords` from classical**

### Barre decision

**Drop `intermediate-barre-chords` from the classical recommended path.** It remains available in the catalogue for curiosity (nothing is level-locked), but it should not appear in `paths.classical`. Early classical progression here prioritises stroke quality, reading a few notes, and a short melody; barre is an intermediate steel-string / later-grade skill, not a beginner-path gate.

## Non-goals (classical beginner path)

- Pick strumming as a required skill (`beginner-basic-strumming` stays off this path)
- Distortion / amp-driven electric setup
- Barre as a beginner or early-intermediate requirement
- Claiming staff fluency from three open-string landmarks alone

---

## New lesson 1 — `classical-rest-stroke`

| Field | Value |
| --- | --- |
| **id** | `classical-rest-stroke` |
| **title** | Rest Stroke on Open Treble |
| **description** | Finish each pluck against the neighbouring thicker string. |
| **minutes** | 5 |
| **outcome** | Play open G, B and high e with a controlled rest stroke (apoyando). |
| **practice** | On open G, plant i so the fingertip comes to rest on the B string after the pluck. Repeat with m. Move to open B (rest on G) and open high e (rest on B). Alternate i and m slowly; compare tone with yesterday’s free stroke. |
| **readyWhen** | Several notes sound firm and even, and you can feel the finger land on the next thicker string without tensing the wrist. |

### Sections (foundationContent)

1. **heading:** What a rest stroke does  
   **body:** A rest stroke (apoyando) plucks one string and then comes to rest on the next thicker neighbour. On open G the finger finishes on B; on open B it finishes on G; on open high e it finishes on B. The brief stop steadies the hand and often produces a fuller tone than a free stroke. Keep the motion small: the fingertip travels through the string and settles, rather than flicking away into the air. Use i and m only for this lesson; leave the thumb quiet on the soundboard or beside the strings.

2. **heading:** Open treble only, no rush  
   **body:** Stay on the three open treble strings so fretting-hand pressure does not compete with a new plucking habit. Alternate i and m on one string until the landing feels predictable, then change strings. If the finger misses the neighbour or the wrist stiffens, lighten the touch and slow down. The listening drill checks sounding pitch, not which finger you used or whether the rest landed perfectly—you confirm the rest by feel and by listening for a solid, unhurried tone.

### Drill

- **title:** Open Treble Rest Stroke  
- **intro:** Pluck each open treble string with a rest stroke (land on the next thicker string). Alternate i and m. The app checks pitch, not finger choice.  
- **defaultMode:** `mono` · **secondsPerTarget:** 8  
- **targets:**

```
note(3, 0, 'G open — rest on B')
note(4, 0, 'B open — rest on G')
note(5, 0, 'e open — rest on B')
note(4, 0, 'B open — rest on G')
note(3, 0, 'G open — rest on B')
```

---

## New lesson 2 — `classical-treble-melody`

| Field | Value |
| --- | --- |
| **id** | `classical-treble-melody` |
| **title** | A Short Treble Melody |
| **description** | Link a few first-position notes into one quiet phrase. |
| **minutes** | 6 |
| **outcome** | Play an original 8-note phrase on G, B and high e in frets 0–3. |
| **practice** | Learn the eight targets in order at a slow pulse. Name string and fret before each note. Use free stroke or rest stroke—whichever feels steadier today. Repeat the phrase twice without stopping between notes. |
| **readyWhen** | You can play the whole phrase slowly from memory or from the drill order, with clear starts and no need to hunt for each fret. |

Original exercise only — not a folk tune, nursery song, or graded-exam piece.

### Sections (foundationContent)

1. **heading:** One phrase, three strings  
   **body:** This lesson uses only the G, B and high e strings (string indices 3, 4 and 5) and frets 0 through 3. The eight-note line rises from open G through a neighbour on B, touches high e, then settles back. Treat it as a short phrase with a beginning and an end, not eight isolated drills. Keep the fretting hand light: press just behind the fret wire, release cleanly when the next note is open, and shift the hand rather than stretching if a reach feels forced.

2. **heading:** Sound first, speed never  
   **body:** Choose one plucking approach for the whole pass—free stroke or rest stroke—so the right hand stays consistent while the left hand finds new frets. Count a slow four before you start if that helps you breathe between notes. Matching pitch in the app shows you found the written target; it cannot judge tone quality or finger labels. When the phrase feels familiar, play it once more without looking at the screen, then stop while it still sounds clear.

### Drill

- **title:** Terrace Phrase (original)  
- **intro:** Play this original eight-note phrase on G, B and high e only (frets 0–3). One note at a time; Follow Me waits.  
- **defaultMode:** `mono` · **secondsPerTarget:** 8  
- **targets:**

```
note(3, 0, 'G open')
note(3, 2, 'G fret 2 (A)')
note(4, 0, 'B open')
note(4, 1, 'B fret 1 (C)')
note(5, 0, 'e open')
note(5, 3, 'e fret 3 (G)')
note(4, 0, 'B open')
note(3, 0, 'G open')
```

Phrase shape (for implementers): open G → A on G → open B → C on B → open e → G on e → open B → open G. Eight notes; all on stringIndex 3|4|5 and frets 0–3.

---

## Implementer checklist

- [ ] Add both lessons to `newLessons` / coaching fields in `curriculum.ts` (or equivalent)
- [ ] Wire two `foundationContent` sections each (bodies > 40 words as drafted)
- [ ] Add both drills in `drills.ts` with the targets above
- [ ] Rewrite `paths.classical` to the proposed unit order
- [ ] Remove `intermediate-barre-chords` from classical units only
- [ ] Leave `beginner-basic-strumming` and electric lessons off this path
- [ ] Do not edit this brief into existing lesson source until the reorder lands
