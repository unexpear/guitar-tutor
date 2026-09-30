# Beginner cello sequence (StandardTune brief)

Implementation brief only. Do **not** edit existing source until a product decision ships a cello learning path. Tuner profile `cello` is **experimental**. Learn has **no** cello lesson path today.

Research touchstones (do not copy exam pieces, scale lists, or etude text): ABRSM Cello Initial Grade from 2024 emphasises seated playing with endpin, first position, separate bows, and one-octave G and D major starting on open strings. Cello bow hold is **not** the violin hold—the pinky does not sit on top of the stick, and the bow is heavier. Thumb position and tenor clef are **not** beginner skills.

**Scoring limit:** the app may check **open-string pitch** only (C2–G2–D3–A3 via the experimental cello tuner). It does **not** grade bow hold, contact point, posture, or left-hand shape. All three lessons are **SELF-CHECK**.

**Tuning (reference):** standard cello C2 G2 D3 A3 (profile `cello-standard`).

## Non-goals

- Shipping a Learn curriculum path or learning-instrument entry for cello
- Violin bow-hold instructions, thumb position, or tenor-clef reading
- Graded-exam pieces, named etudes, or copyrighted method-book exercises
- Claiming the tuner certifies bow quality or separate-bow rhythm
- Shifting beyond first position in this beginner set

## Proposed sequence (at most three lessons)

Optional catalogue content only—not wired into `paths.*`, not a progress gate.

1. `cello-endpin-sit` — endpin height and seated balance
2. `cello-bow-open-gd` — cello bow hold; open G and D as quarter notes, separate bows
3. `cello-first-position` — first-position idea on G and D strings (original pattern only)

---

## Lesson `cello-endpin-sit`

| Field | Content |
| --- | --- |
| **id** | `cello-endpin-sit` |
| **title** | Endpin and Sitting Balance |
| **description** | Seat the cello with the endpin so the instrument stands without your left hand holding it up. |
| **minutes** | 5 |
| **outcome** | Sit with both feet stable, set a workable endpin height, and keep the cello balanced while both hands rest lightly. |
| **practice** | Choose a firm chair without arms. Extend the endpin so the instrument leans into your body at a comfortable angle—neck rising slightly, C peg roughly near head height when you sit tall. Place the lower bouts between the knees. Release the left hand from the neck for a few breaths; the cello should stay put. Soften the shoulders. Self-check only—no pitch drill. |
| **readyWhen** | You can sit without gripping the neck to support the cello, both feet feel planted, and your shoulders stay loose for half a minute of quiet sitting. |

### Sections

#### Endpin height before any note

Cello beginners start seated with an endpin, not standing like many violinists. Unlock or adjust the spike so the body of the instrument rests between your knees and leans lightly against your chest when you sit toward the front of a stable chair. Too short and you hunch; too long and the cello slips or forces the left arm awkwardly high. Aim for a neck that rises gently away from you, with room for a straightish spine. Check that the spike tip will not skate on a hard floor—use a stopper or mat if needed. Do not chase a perfect centimetre on day one; chase a height where both feet stay flat and the instrument does not tip when you let go of the neck.

#### Balance without gripping the neck

Once seated, rest both hands lightly: left fingertips near the fingerboard without clamping, right hand on the right knee or loosely near the bridge area. Breathe and notice whether the cello stays put. If it falls away when you release the neck, shorten or lengthen the endpin and reseat the lower bouts. If your left shoulder climbs, lower the instrument slightly or sit taller. This lesson has no sounding target. StandardTune’s experimental cello tuner is for later open-string pitch checks; it cannot see posture. Mark ready when *you* feel stable support from the chair, knees, and endpin—not when a needle turns green.

---

## Lesson `cello-bow-open-gd`

| Field | Content |
| --- | --- |
| **id** | `cello-bow-open-gd` |
| **title** | Cello Bow Hold and Open G–D |
| **description** | Form a cello-weight bow hold, then draw separate quarter-note bows on open G and open D. |
| **minutes** | 7 |
| **outcome** | Hold the bow with a cello-appropriate hand (pinky not perched on top like violin), and play even open G and D quarter notes with separate bows. |
| **practice** | Optional: open Tune, choose experimental cello, confirm open G2 and D3. Then put the phone aside. Form the bow hold: thumb bent on the stick near the frog, fingers draped over the stick; the pinky sits more around or beside the stick—not balanced on top as on violin—because the cello bow is heavier. On open G, draw down-bow then up-bow as calm quarter notes; repeat on open D. Separate bows only. Judge tone and hand comfort yourself—the app does not grade the bow. |
| **readyWhen** | Several G and D quarter notes start and stop cleanly with separate bows, the pinky is not perched violin-style on top, and the wrist feels free rather than locked. |

### Sections

#### Cello bow hold is not the violin hold

The cello bow is heavier than a violin bow, so the hand distributes weight differently. Place a bent thumb under the stick near the frog; let the other fingers curve over the stick with flexible knuckles. Keep the pinky participating in the grip around or beside the stick rather than balancing on the top facet the way many violin holds do. A stiff pinky on top often fights the cello stick’s mass and raises the shoulder. Hold firmly enough that the bow does not drop, loosely enough that the stick can still tilt slightly as you change strings. Shake the hand out between tries. If anything hurts, stop; this is a self-observation task, not a score chase.

#### Open G and D, separate quarter bows

Stay on two open strings that ABRSM Initial work treats as home: G (G2) and D (D3). Use separate bows—one stroke per quarter note—not slurred pairs. Start near the middle of the bow with a short, calm stroke; listen for a clear start without a scratchy attack. Play four quarters on G, rest, then four on D. Optionally glance at the experimental cello tuner once to confirm each open pitch, then ignore the needle while you listen for even length and a free right arm. The tuner may verify open-string pitch only; it cannot certify contact point, bow speed, or pinky placement. Ready means *your* ears hear steady G and D quarters and *your* hand feels like a cello hold, not a copied violin perch.

---

## Lesson `cello-first-position`

| Field | Content |
| --- | --- |
| **id** | `cello-first-position` |
| **title** | First Position on G and D |
| **description** | Place the left hand in first position and walk a short original pattern on G and D—no exam piece. |
| **minutes** | 8 |
| **outcome** | Keep the hand in first position and play an original ascending–descending idea on open G/D and simple stopped notes toward one-octave G and D major landmarks. |
| **practice** | Seat and bow as in the earlier lessons. In first position, find open G, then first-finger A and third/fourth-finger C-ish landmarks on the G string toward a one-octave G major shape starting on open G; then open D and neighbouring first-position notes toward D major starting on open D. Use separate bows and a slow pulse. Play this **original** outline only—do not copy a graded piece or published etude. Self-check tone and hand shape; tuner optional for open strings only. |
| **readyWhen** | You can repeat the short original G-string and D-string outline slowly in first position with separate bows, without sliding into a higher position or reading tenor clef. |

Original exercise only — not an ABRSM set piece, folk tune, or copyrighted etude.

### Sections

#### First position stays by the nut

First position means the left hand stays near the scroll end of the fingerboard: the first finger’s home is a step above the open string, and higher fingers fill the nearby steps without the thumb sliding up under the neck into thumb position. On cello, initial grade work centres on one-octave G major and D major that **begin on the open string**. Sketch the idea on G: open G, then the neighbouring first-position notes that outline that octave’s lower half, separate bow on each note. Mirror the idea on open D for D major’s opening region. Keep the thumb behind the neck opposite the fingers—not over the fingerboard. If the hand creeps toward the bridge, reset to the nut end and restart. Tenor clef and thumb position wait for later years; do not invent them here.

#### Original outline, not an exam reprint

Practise a short, nameless pattern you can remember: for example, open G → first finger → third finger → back to first → open G, then the same shape starting on open D, always separate bows and always in first position. Treat it as a balance and intonation sketch toward those open-string major scales—not as a performance piece. Optional: confirm open G and open D with the experimental cello tuner before you start; stop using the needle once fingers land. Pitch detection cannot hear whether you stayed in first position or whether the bow was separate. Do not paste measures from any graded syllabus, Suzuki book, or named etude into the app. Ready when *you* can play your outline twice slowly with a calm bow and a hand that never leaves first position.

---

## Implementation notes (for later; this file is the only deliverable)

- Do not add cello to `LEARNING_INSTRUMENTS` or `paths.*` from this brief alone.
- Self-check prose only; no scored bow drill; open-string tuner check is optional helper text.
- At most these three `cello-*` ids; no copyrighted etudes or exam-piece melody.
- Keep violin hold, thumb position, and tenor clef out of beginner copy.
