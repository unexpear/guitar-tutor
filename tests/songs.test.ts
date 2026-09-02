import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SONGS, getSong } from '../features/songs/data/songs';
import { getChord } from '../features/chords/data/chords';

test('every song is well formed', () => {
  const ids = new Set<string>();
  for (const s of SONGS) {
    assert.ok(s.title.trim(), 'a song has no title');
    assert.ok(s.artist.trim(), `${s.title}: no artist`);
    assert.ok(s.key.trim(), `${s.title}: no key`);
    assert.ok(s.note.trim(), `${s.title}: no note`);
    assert.match(s.duration, /^\d+:\d{2}$/, `${s.title}: odd duration`);
    assert.ok(!ids.has(s.id), `duplicate song id ${s.id}`);
    ids.add(s.id);
    if (s.capo !== undefined) {
      assert.ok(s.capo >= 1 && s.capo <= 9, `${s.title}: implausible capo ${s.capo}`);
    }
  }
});

test('every chord a song names exists in the chord library', () => {
  for (const s of SONGS) {
    assert.ok(s.chords.length >= 2, `${s.title}: needs at least two chords`);
    for (const name of s.chords) {
      assert.ok(
        getChord(name),
        `${s.title}: chord "${name}" is not in the chord library, so its diagram would be missing`
      );
    }
  }
});

test('a song does not list the same chord twice', () => {
  for (const s of SONGS) {
    assert.equal(
      new Set(s.chords).size,
      s.chords.length,
      `${s.title}: repeats a chord`
    );
  }
});

test('signature beginner songs use their characteristic shapes', () => {
  assert.deepEqual(getSong('2')?.chords, ['Em', 'D6/9/F#']);
  assert.deepEqual(
    getSong('6')?.chords,
    ['Em7', 'G (320033)', 'Dsus4', 'A7sus4', 'Cadd9'],
  );
});

const BARRE_CHORDS = new Set([
  'F', 'B', 'Bb', 'Eb', 'Ab', 'F#', 'Cm', 'Fm', 'Gm', 'F#m', 'G#m', 'C#m',
]);

test('easy songs stay easy', () => {
  // An Easy song is one a beginner can actually get through: at most four
  // shapes, and at most one barre. A barre is allowed because the songs that
  // teach your first one are worth having - but the song's note has to warn
  // the player it is coming, by name.
  for (const s of SONGS.filter((x) => x.difficulty === 'Easy')) {
    assert.ok(
      s.chords.length <= 4,
      `${s.title}: ${s.chords.length} chords is a lot for Easy`
    );
    const barres = s.chords.filter((c) => BARRE_CHORDS.has(c));
    assert.ok(
      barres.length <= 1,
      `${s.title}: ${barres.length} barre chords is too many for Easy (${barres.join(', ')})`
    );
    for (const c of barres) {
      assert.ok(
        s.note.includes(c),
        `${s.title}: uses the ${c} barre, so the note must mention it`
      );
    }
  }
});

test('getSong finds songs by id and misses cleanly', () => {
  assert.equal(getSong('1')?.title, SONGS[0].title);
  assert.equal(getSong('nope'), undefined);
});
