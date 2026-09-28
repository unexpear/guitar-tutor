import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curriculumFor, curriculumProgress, LESSONS } from '../features/lessons/data/curriculum';
import { LEARNING_INSTRUMENTS, learningTuningId, restoreLearningInstrument } from '../features/lessons/data/learningInstrument';
import { LESSON_CONTENT } from '../features/lessons/data/lessonContent';
import { DRILLS, BASS_OPEN_MIDI } from '../features/lessons/data/drills';
import { STAFF_PRIMER } from '../features/lessons/data/notationPrimer';
import { TargetMatcher } from '../features/lessons/playalong/matcher';
import { tuningPresetById, noteToFrequency } from '../features/tuner/data/tunings';
import { guitarPracticeEngineOptions, lessonPracticeEngineOptions } from '../features/tuner/data/instrumentProfiles';

test('every path has reachable, unique lessons with a task and readiness check', () => {
  const reachable = new Set<string>();
  assert.equal(new Set(LESSONS.map(l => l.id)).size, LESSONS.length);
  for (const { value } of LEARNING_INSTRUMENTS) {
    const lessons = curriculumFor(value).flatMap(unit => unit.lessons);
    assert.ok(lessons.length >= 10);
    assert.equal(new Set(lessons.map(l => l.id)).size, lessons.length);
    assert.ok(tuningPresetById(learningTuningId(value)));
    for (const lesson of lessons) {
      reachable.add(lesson.id);
      assert.ok(lesson.component || LESSON_CONTENT[lesson.id]?.length >= 2, lesson.id);
      assert.ok(lesson.minutes >= 3 && lesson.minutes <= 10, lesson.id);
      for (const text of [lesson.outcome, lesson.practice, lesson.readyWhen]) {
        assert.ok(text.length > 25, lesson.id);
      }
    }
  }
  assert.deepEqual([...reachable].sort(), LESSONS.map(l => l.id).sort());
  for (const id of Object.keys(DRILLS)) assert.ok(reachable.has(id), `orphan drill: ${id}`);
});

test('bass uses only bass or shared music lessons and four-string note drills', () => {
  for (const { value } of LEARNING_INSTRUMENTS) {
    for (const lesson of curriculumFor(value).flatMap(unit => unit.lessons)) {
      if (value !== 'bass') { assert.ok(!lesson.id.startsWith('bass-')); continue; }
      assert.match(lesson.id, /^(bass|music)-/);
      assert.equal(lesson.component, undefined);
      const drill = DRILLS[lesson.id];
      if (!drill) continue;
      assert.equal(drill.instrument, 'bass');
      for (const target of drill.targets) {
        assert.equal(target.kind, 'note');
        if (target.kind === 'note') assert.ok(target.stringIndex >= 0 && target.stringIndex < 4);
      }
    }
  }
});

test('classical begins with support and fingerstyle, then notation before chords', () => {
  const ids = curriculumFor('classical').flatMap(unit => unit.lessons.map(l => l.id));
  assert.equal(ids[0], 'classical-posture');
  assert.ok(ids.indexOf('classical-first-touch') < ids.indexOf('beginner-two-chords'));
  assert.ok(ids.indexOf('classical-reading-music') < ids.indexOf('beginner-two-chords'));
  assert.ok(!ids.includes('electric-setup'));
  assert.ok(!ids.includes('advanced-techniques'));
});

test('path progress carries shared foundations but not unrelated or obsolete lessons', () => {
  const completed = { 'music-pulse': { completed: true }, 'bass-first-notes': { completed: true }, obsolete: { completed: true } };
  const saved = structuredClone(completed);
  assert.equal(curriculumProgress('bass', completed).completed, 2);
  assert.equal(curriculumProgress('acoustic', completed).completed, 1);
  assert.equal(curriculumProgress('bass', completed).next?.id, 'bass-right-hand');
  assert.deepEqual(completed, saved);
  const all = Object.fromEntries(curriculumFor('bass').flatMap(unit => unit.lessons.map(l => [l.id, { completed: true }])));
  assert.equal(curriculumProgress('bass', all).next, null);
});

test('legacy instrument choices migrate safely without discarding valid preferences', () => {
  assert.equal(restoreLearningInstrument(undefined, 'classical'), 'classical');
  assert.equal(restoreLearningInstrument(undefined, 'bass'), 'bass');
  assert.equal(restoreLearningInstrument('bass', 'acoustic'), 'bass');
  assert.equal(restoreLearningInstrument('piano', 'electric'), 'electric');
  assert.equal(restoreLearningInstrument('piano', null), 'acoustic');
});

test('bass targets, tuner tuning and calibrated pitch matching agree on sounding octaves', () => {
  const referencePitchHz = 442;
  const frequency = (midi: number) => referencePitchHz * 2 ** ((midi - 69) / 12);
  const strings = tuningPresetById(learningTuningId('bass'))!.strings;
  BASS_OPEN_MIDI.forEach((midi, i) => assert.ok(Math.abs(noteToFrequency(strings[i], referencePitchHz) - frequency(midi)) < 0.0001));
  for (const drill of Object.values(DRILLS).filter(d => d.instrument === 'bass')) {
    for (const target of drill.targets) {
      assert.equal(target.kind, 'note');
      if (target.kind !== 'note') continue;
      const matcher = new TargetMatcher(target, { openStringMidi: BASS_OPEN_MIDI, referencePitchHz, allowOctaveUp: false });
      const sample = { frequency: frequency(BASS_OPEN_MIDI[target.stringIndex] + target.fret), confidence: 0.99, rmsDb: -20, tMs: 0 };
      assert.equal(matcher.feed(sample), null);
      assert.equal(matcher.feed({ ...sample, tMs: 40 }), 'hit', `${drill.lessonId}: ${target.label}`);
    }
  }
  const wrong = new TargetMatcher({ kind: 'note', stringIndex: 0, fret: 1, label: 'F1' }, { openStringMidi: BASS_OPEN_MIDI });
  const outcomes = Array.from({ length: 12 }, (_, i) => wrong.feed({ frequency: 55, confidence: 0.99, rmsDb: -20, tMs: i * 40 }));
  assert.ok(!outcomes.includes('hit'));
  assert.ok(outcomes.includes('wrong'));
  assert.deepEqual(lessonPracticeEngineOptions(442), guitarPracticeEngineOptions(442));
  assert.ok(lessonPracticeEngineOptions(442, true).minFrequency! < frequency(28));
  assert.ok(lessonPracticeEngineOptions(442, true).hpfCutoffHz! < frequency(28));
});

test('staff guides use correct line positions and octave-transposing notation', () => {
  const diatonic = (note: string) => Number(note.at(-1)) * 7 + 'CDEFGAB'.indexOf(note[0]);
  for (const clef of ['treble', 'bass'] as const) {
    const bottom = clef === 'treble' ? 'E4' : 'G2';
    for (const note of STAFF_PRIMER[clef]) {
      assert.equal(note.writtenMidi - note.soundingMidi, 12);
      assert.equal(note.staffSteps, diatonic(note.written) - diatonic(bottom));
      assert.ok(Math.abs(noteToFrequency(note.written) - 440 * 2 ** ((note.writtenMidi - 69) / 12)) < 0.0001);
    }
  }
});
