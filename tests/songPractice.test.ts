import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getChord } from '../features/chords/data/chords';
import { SONGS } from '../features/songs/data/songs';
import {
  arrangementEvents,
  buildSongPracticeDrill,
  capoChoicesForSong,
  songPracticeScoreKey,
  songPracticeFeedback,
  songCorrectionIssueUrl,
  soundingKeyForCapo,
  transposeChordName,
  transposeNoteEvent,
} from '../features/songs/songPractice';
import { stringFretToMidi } from '../features/chords/data/chords';
import { practiceScore, targetDurationMs } from '../features/lessons/playalong/timing';
import { TargetMatcher } from '../features/lessons/playalong/matcher';
import { guideChordMidiNotes } from '../features/songs/songPractice';

test('capo chord scoring matches guide audio while retaining finger shapes', () => {
  for (const song of SONGS.filter((song) => song.arrangement)) {
    for (const capo of [0, 2, 5]) {
      const options = {sectionId: null, tempoPercent: 75 as const, transposeSemitones: 0, capo};
      const drill = buildSongPracticeDrill(song, options);
      arrangementEvents(song, null).forEach((event, index) => {
        if (event.kind !== 'chord') return;
        const expected = guideChordMidiNotes(event.chordName, 0, capo);
        if (!expected.length) return;
        assert.deepEqual([...new TargetMatcher(drill.targets[index]).state().targetClasses].sort(),
          [...new Set(expected.map((midi) => midi % 12))].sort());
      });
    }
  }
});

test('stale saved section IDs recover to the complete playable chart', () => {
  for (const song of SONGS.filter((song) => song.arrangement)) {
    assert.deepEqual(arrangementEvents(song, 'removed-section'), arrangementEvents(song, null));
    assert.ok(buildSongPracticeDrill(song, {sectionId: 'removed-section', tempoPercent: 75, capo: 0}).targets.length);
  }
});

test('Follow Me can earn full credit without timing attempts', () => {
  assert.equal(practiceScore(100, 0, false), 100);
  assert.equal(practiceScore(75, 0, false), 75);
  assert.equal(practiceScore(100, 50, true), 80);
});

test('references build chord exercises and generic exercises build their complete charts', () => {
  for (const song of SONGS) {
    const drill = buildSongPracticeDrill(song);
    const names = drill.targets.map((target) => {
      return target.kind === 'chord' ? target.chordName : '';
    });

    if (song.arrangement) {
      assert.deepEqual(names.filter(Boolean), arrangementEvents(song, null).filter((e) => e.kind === 'chord').map((e) => e.kind === 'chord' ? e.chordName : ''));
      assert.equal(drill.bpm, Math.round(song.arrangement.bpm * 0.75));
      assert.match(drill.intro, /generic CC0 practice exercise/i);
    } else {
      assert.ok(drill.targets.every((target) => target.kind === 'chord'));
      assert.deepEqual(names, [...song.chords, ...song.chords]);
      assert.equal(drill.defaultMode, 'poly');
      assert.match(drill.intro, /not the song arrangement/i);
    }
    for (const name of names.filter(Boolean)) assert.ok(getChord(name), `${song.title}: missing ${name}`);
  }
});

test('transposition uses real library shapes and capo suggestions preserve the sounding key', () => {
  assert.equal(transposeChordName('G', 2), 'A');
  assert.equal(transposeChordName('Bb', -2), 'Ab');
  const song = SONGS.find((candidate) => candidate.id === 'original-first-light');
  assert.ok(song);
  const choices = capoChoicesForSong(song, 2);
  assert.ok(choices.length > 0);
  assert.ok(choices.every((choice) => choice.shapes.every((shape) => getChord(shape))));
  const familiar = choices.find((choice) => choice.capo === 2);
  assert.deepEqual(familiar?.shapes, ['G', 'D', 'Em', 'C']);
  const drill = buildSongPracticeDrill(song, { sectionId: 'verse', tempoPercent: 75, capo: 2, transposeSemitones: 2 });
  assert.equal(drill.targets[0].kind === 'chord' ? drill.targets[0].chordName : '', 'G');
});

test('every offered transposition has playable shapes, including downward changes', () => {
  for (const song of SONGS.filter((candidate) => candidate.arrangement)) {
    for (let semitones = -5; semitones <= 6; semitones += 1) {
      const choices = capoChoicesForSong(song, semitones);
      assert.ok(choices.length > 0, `${song.title}: no shapes at ${semitones}`);
      assert.ok(choices.every((choice) => choice.capo <= 11));
      assert.ok(choices.every((choice) => choice.shapes.every((shape) => getChord(shape))));
    }
  }
  assert.equal(transposeChordName('G (320033)', -12), 'G (320033)');
});

test('tab arrangements transpose to a playable position and do not suggest a fake capo', () => {
  const song = SONGS.find((candidate) => candidate.id === 'original-string-lanterns');
  assert.ok(song?.arrangement);
  const source = arrangementEvents(song, null)[0];
  assert.equal(source.kind, 'note');
  if (source.kind !== 'note') return;
  const moved = transposeNoteEvent(source, -5);
  assert.equal(
    ((stringFretToMidi(moved.stringIndex, moved.fret) - stringFretToMidi(source.stringIndex, source.fret)) % 12 + 12) % 12,
    7,
  );
  assert.deepEqual(capoChoicesForSong(song, -5).map((choice) => choice.capo), [0]);
  const drill = buildSongPracticeDrill(song, { sectionId: null, tempoPercent: 75, capo: 0, transposeSemitones: -5 });
  const target = drill.targets[0];
  assert.equal(target.kind, 'note');
  if (target.kind === 'note') {
    assert.equal(
      ((stringFretToMidi(target.stringIndex, target.fret) - stringFretToMidi(source.stringIndex, source.fret)) % 12 + 12) % 12,
      7,
    );
  }
});

test('section loops and speed controls change only the requested practice run', () => {
  const song = SONGS.find((candidate) => candidate.id === 'original-first-light');
  assert.ok(song?.arrangement);
  const verse = buildSongPracticeDrill(song, { sectionId: 'verse', tempoPercent: 50, capo: 0 });
  assert.equal(verse.targets.length, 8);
  assert.equal(verse.bpm, 36);
  assert.match(verse.title, /Loop A/);
  assert.equal(song.arrangement.sections.length, 2, 'source arrangement was not mutated');
});

test('song finger guides retain exact event beats at the selected tempo', () => {
  for (const song of SONGS.filter((candidate) => candidate.arrangement)) {
    const drill = buildSongPracticeDrill(song, {
      sectionId: null,
      tempoPercent: 100,
      capo: 0,
    });
    const source = arrangementEvents(song, null);
    assert.equal(drill.targets.length, source.length, `${song.title}: target count`);
    drill.targets.forEach((target, index) => {
      assert.equal(target.beats, source[index].beats, `${song.title}: beat ${index}`);
      assert.equal(
        targetDurationMs(drill, target),
        source[index].beats * 60_000 / song.arrangement!.bpm,
        `${song.title}: duration ${index}`,
      );
    });
  }
});

test('capo planner reports the sounding key without changing familiar shapes', () => {
  assert.equal(soundingKeyForCapo('G', 2), 'A');
  assert.equal(soundingKeyForCapo('Am', 3), 'Cm');
  assert.equal(soundingKeyForCapo('Eb', 2), 'F');
  assert.equal(soundingKeyForCapo('unknown', 4), 'unknown');
});

test('practice feedback gives a concrete next action at every level', () => {
  assert.match(songPracticeFeedback(95), /100% speed|harder section/i);
  assert.match(songPracticeFeedback(80), /loop/i);
  assert.match(songPracticeFeedback(60), /75%|Follow Me/i);
  assert.match(songPracticeFeedback(20), /50%|first two/i);
});

test('song practice score keys are stable and unique', () => {
  const keys = SONGS.map((song) => songPracticeScoreKey(song.id));
  assert.equal(new Set(keys).size, SONGS.length);
  assert.ok(keys.every((key) => key.startsWith('song-practice:')));
});

test('community correction links are explicit, encoded, and reviewable', () => {
  const song = SONGS.find((candidate) => candidate.id === 'original-first-light');
  assert.ok(song);
  const url = songCorrectionIssueUrl(song, 'Bar 4: try Am7 & explain why');
  assert.match(url, /^https:\/\/github\.com\/unexpear\/guitar-tutor\/issues\/new\?/);
  assert.match(decodeURIComponent(url), /Bar 4: try Am7 & explain why/);
  assert.match(decodeURIComponent(url), /public community review/);
});
