import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PRACTICE_EXERCISES,
  SONG_REFERENCES,
  SONGS,
  getSong,
  isPracticeExercise,
} from '../features/songs/data/songs';
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
  assert.equal(getSong('1')?.title, "Knockin' on Heaven's Door");
  assert.equal(getSong('nope'), undefined);
});

test('generic exercises and song references stay explicitly separated', () => {
  const complete = SONGS.filter((song) => song.arrangement);
  const references = SONGS.filter((song) => !song.arrangement);
  assert.equal(complete.length, 26);
  assert.equal(references.length, 15);
  assert.deepEqual(complete, PRACTICE_EXERCISES);
  assert.deepEqual(references, SONG_REFERENCES);
  assert.ok(complete.every((song) => song.arrangement?.license === 'CC0-1.0'));
  assert.ok(complete.every((song) => song.artist === 'Practice Exercise'));
  assert.ok(complete.every(isPracticeExercise));
  assert.ok(references.every((song) => !isPracticeExercise(song)));
  assert.ok(!SONGS.some((song) => song.artist === 'StandardTune Studio'));
  assert.ok(complete.some((song) => song.arrangement?.sections.some((section) => section.events.some((event) => event.kind === 'note'))));
});

test('common progressions and mechanical riffs are present as playable exercises', () => {
  const titles = new Set(PRACTICE_EXERCISES.map((exercise) => exercise.title));
  assert.ok(titles.has('I–IV–V–I in C'));
  assert.ok(titles.has('I–vi–IV–V in C'));
  assert.ok(titles.has('vi–IV–I–V in C'));
  assert.ok(titles.has('ii–V–I in C'));
  assert.ok(titles.has('i–VII–VI–V in A Minor'));
  assert.ok(titles.has('Chromatic 1–2–3–4'));
  assert.ok(titles.has('A Minor Pentatonic Box Fragment'));
  assert.ok(titles.has('Open-String Picking Ladder'));
});

test('every complete chart has a valid finger guide and positive timing', () => {
  for (const song of SONGS.filter((candidate) => candidate.arrangement)) {
    for (const section of song.arrangement!.sections) {
      assert.ok(section.events.length > 0, `${song.title}: empty ${section.label}`);
      for (const event of section.events) {
        assert.ok(Number.isFinite(event.beats) && event.beats > 0, `${song.title}: bad beat length`);
        if (event.kind === 'chord') {
          assert.ok(getChord(event.chordName), `${song.title}: missing guide for ${event.chordName}`);
        } else {
          assert.ok(event.stringIndex >= 0 && event.stringIndex < 6, `${song.title}: bad string`);
          assert.ok(event.fret >= 0 && event.fret <= 24, `${song.title}: bad fret`);
        }
      }
    }
  }
});
