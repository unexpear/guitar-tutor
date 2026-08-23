import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DRILLS, getDrill } from '../features/lessons/data/drills';
import { getChord, OPEN_STRING_MIDI, stringFretToMidi } from '../features/chords/data/chords';

const drills = Object.values(DRILLS);

test('every drill is keyed by the lesson it belongs to', () => {
  for (const [key, drill] of Object.entries(DRILLS)) {
    assert.equal(drill.lessonId, key, `${key}: lessonId does not match its key`);
    assert.ok(drill.title.trim(), `${key}: no title`);
    assert.ok(drill.intro.trim().length > 40, `${key}: intro is too thin to be useful`);
    assert.equal(getDrill(key)?.lessonId, key);
  }
});

test('the lessons that should have a drill have one', () => {
  // Two deliberate exceptions, both because there is nothing to play:
  // Guitar Anatomy has its own interactive diagram and quiz, and Reading
  // Chord Diagrams teaches notation and sends you to the Chords tab.
  const expected = [
    'beginner-reading-tabs',
    'beginner-open-chords',
    'beginner-basic-strumming',
    'intermediate-barre-chords',
    'intermediate-fingerpicking',
    'intermediate-scales-101',
    'intermediate-music-theory',
    'advanced-improvisation',
    'advanced-techniques',
    'advanced-songwriting',
  ];
  for (const id of expected) {
    assert.ok(getDrill(id), `${id} has no drill`);
  }
  assert.equal(getDrill('beginner-guitar-anatomy'), undefined);
  assert.equal(getDrill('beginner-reading-diagrams'), undefined);
});

test('every drill has enough targets to be worth starting', () => {
  for (const d of drills) {
    assert.ok(d.targets.length >= 4, `${d.lessonId}: only ${d.targets.length} targets`);
    assert.ok(d.secondsPerTarget >= 3, `${d.lessonId}: flow mode would be unplayable`);
  }
});

test('every chord target names a chord in the library', () => {
  for (const d of drills) {
    for (const t of d.targets) {
      if (t.kind !== 'chord') continue;
      assert.ok(
        getChord(t.chordName),
        `${d.lessonId}: chord "${t.chordName}" is not in the library`
      );
    }
  }
});

test('every note target is on a real string at a playable fret', () => {
  for (const d of drills) {
    for (const t of d.targets) {
      if (t.kind !== 'note') continue;
      assert.ok(
        t.stringIndex >= 0 && t.stringIndex < OPEN_STRING_MIDI.length,
        `${d.lessonId}: string index ${t.stringIndex} does not exist`
      );
      assert.ok(
        t.fret >= 0 && t.fret <= 15,
        `${d.lessonId}: fret ${t.fret} is off the useful neck`
      );
      assert.ok(t.label.trim(), `${d.lessonId}: a note target has no label`);
    }
  }
});

test('the same target never appears twice in a row', () => {
  // Back-to-back identical targets cannot be told apart: the ring of the
  // first satisfies the second.
  for (const d of drills) {
    for (let i = 1; i < d.targets.length; i++) {
      const a = d.targets[i - 1];
      const b = d.targets[i];
      if (a.kind === 'note' && b.kind === 'note') {
        assert.ok(
          !(a.stringIndex === b.stringIndex && a.fret === b.fret),
          `${d.lessonId}: ${a.label} repeats at position ${i}`
        );
      }
      if (a.kind === 'chord' && b.kind === 'chord') {
        assert.notEqual(
          a.chordName,
          b.chordName,
          `${d.lessonId}: ${a.chordName} repeats at position ${i}`
        );
      }
    }
  }
});

test('a click track, where present, is a sane tempo', () => {
  for (const d of drills) {
    if (d.bpm === undefined) continue;
    assert.ok(d.bpm >= 40 && d.bpm <= 200, `${d.lessonId}: ${d.bpm} BPM`);
    assert.ok(
      d.beatsPerBar !== undefined && d.beatsPerBar >= 2 && d.beatsPerBar <= 12,
      `${d.lessonId}: bpm is set but beatsPerBar is ${d.beatsPerBar}`
    );
  }
});

test('the C major drill really spells C major', () => {
  const d = getDrill('intermediate-scales-101');
  if (!d) throw new Error('scales drill missing');
  const C_MAJOR = new Set([0, 2, 4, 5, 7, 9, 11]); // C D E F G A B
  for (const t of d.targets) {
    if (t.kind !== 'note') continue;
    const pc = stringFretToMidi(t.stringIndex, t.fret) % 12;
    assert.ok(C_MAJOR.has(pc), `${t.label} (pitch class ${pc}) is not in C major`);
  }
  // Ascends an octave and comes back down.
  const midi = d.targets
    .filter((t) => t.kind === 'note')
    .map((t) => stringFretToMidi(t.stringIndex, t.fret));
  const peak = Math.max(...midi);
  assert.equal(peak - midi[0], 12, 'the run should span exactly one octave');
  assert.equal(midi[0], midi[midi.length - 1], 'it should finish where it started');
});

test('the pentatonic drill really spells A minor pentatonic', () => {
  const d = getDrill('advanced-improvisation');
  if (!d) throw new Error('improvisation drill missing');
  const A_MINOR_PENT = new Set([9, 0, 2, 4, 7]); // A C D E G
  for (const t of d.targets) {
    if (t.kind !== 'note') continue;
    const pc = stringFretToMidi(t.stringIndex, t.fret) % 12;
    assert.ok(
      A_MINOR_PENT.has(pc),
      `${t.label} (pitch class ${pc}) is not in A minor pentatonic`
    );
  }
});

test('the family-of-G drill is exactly the chords in the key of G', () => {
  const d = getDrill('intermediate-music-theory');
  if (!d) throw new Error('theory drill missing');
  const names = d.targets.map((t) => (t.kind === 'chord' ? t.chordName : ''));
  assert.deepEqual(names, ['G', 'Am', 'Bm', 'C', 'D', 'Em']);
});

test('the barre drill only asks for barre chords, in full-chord mode', () => {
  const d = getDrill('intermediate-barre-chords');
  if (!d) throw new Error('barre drill missing');
  assert.equal(d.defaultMode, 'poly', 'a barre drill has to check every string rings');
  const OPEN = new Set(['A', 'C', 'D', 'E', 'G', 'Am', 'Dm', 'Em']);
  for (const t of d.targets) {
    if (t.kind !== 'chord') continue;
    assert.ok(!OPEN.has(t.chordName), `${t.chordName} is an open chord`);
  }
});
