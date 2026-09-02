import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getChord } from '../features/chords/data/chords';
import { SONGS } from '../features/songs/data/songs';
import {
  buildSongPracticeDrill,
  songPracticeScoreKey,
} from '../features/songs/songPractice';

test('every song builds a valid original two-pass chord exercise', () => {
  for (const song of SONGS) {
    const drill = buildSongPracticeDrill(song);
    const names = drill.targets.map((target) => {
      assert.equal(target.kind, 'chord');
      return target.kind === 'chord' ? target.chordName : '';
    });

    assert.deepEqual(names, [...song.chords, ...song.chords]);
    assert.equal(drill.defaultMode, 'poly');
    assert.match(drill.intro, /not the song arrangement/i);
    for (const name of names) assert.ok(getChord(name), `${song.title}: missing ${name}`);
  }
});

test('song practice score keys are stable and unique', () => {
  const keys = SONGS.map((song) => songPracticeScoreKey(song.id));
  assert.equal(new Set(keys).size, SONGS.length);
  assert.ok(keys.every((key) => key.startsWith('song-practice:')));
});
