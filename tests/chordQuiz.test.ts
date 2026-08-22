import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CHORDS, getChord, Chord } from '../features/chords/data/chords';
import {
  buildQuiz,
  buildQuestion,
  pickDistractors,
  poolForLevel,
  shapeDistance,
  isBarreChord,
  rootOf,
  scoreForAnswer,
  mulberry32,
  OPTIONS_PER_QUESTION,
  QUIZ_MODES,
} from '../features/games/chordQuiz/quiz';

const rand = () => mulberry32(12345);
const chord = (name: string): Chord => {
  const c = getChord(name);
  if (!c) throw new Error(`${name} missing from the library`);
  return c;
};

test('rootOf reads the root off a chord name', () => {
  assert.equal(rootOf('A'), 'A');
  assert.equal(rootOf('Am7'), 'A');
  assert.equal(rootOf('C#m'), 'C#');
  assert.equal(rootOf('Bb'), 'Bb');
  assert.equal(rootOf('Fmaj7'), 'F');
});

test('barre chords are recognised and open chords are not', () => {
  assert.equal(isBarreChord(chord('F')), true);
  assert.equal(isBarreChord(chord('Bb')), true);
  assert.equal(isBarreChord(chord('Em')), false);
  assert.equal(isBarreChord(chord('D')), false);
});

test('the beginner pool has no barre chords but is still big enough', () => {
  const pool = poolForLevel('beginner');
  assert.ok(pool.length >= OPTIONS_PER_QUESTION * 2, `pool is only ${pool.length}`);
  for (const c of pool) {
    assert.equal(isBarreChord(c), false, `${c.name} is a barre chord`);
  }
  assert.equal(poolForLevel('all').length, CHORDS.length);
});

test('shape distance is zero against itself and grows with difference', () => {
  const em = chord('Em');
  assert.equal(shapeDistance(em, em), 0);
  // E and Em differ by one finger; Em and D are further apart.
  assert.ok(shapeDistance(em, chord('E')) < shapeDistance(em, chord('D')));
});

test('a question has four distinct options containing the answer once', () => {
  const pool = poolForLevel('beginner');
  const r = rand();
  for (const c of pool) {
    const q = buildQuestion(c, pool, 'name-from-diagram', r);
    assert.equal(q.options.length, OPTIONS_PER_QUESTION, `${c.name}: wrong option count`);
    const names = q.options.map((o) => o.name);
    assert.equal(new Set(names).size, names.length, `${c.name}: duplicate options`);
    assert.equal(
      names.filter((n) => n === c.name).length,
      1,
      `${c.name}: answer should appear exactly once`
    );
  }
});

test('a distractor is never the answer', () => {
  const pool = poolForLevel('all');
  const r = rand();
  for (const c of pool) {
    for (const d of pickDistractors(c, pool, 3, r)) {
      assert.notEqual(d.name, c.name, `${c.name}: got itself as a distractor`);
    }
  }
});

test('distractors prefer a chord sharing the answer root', () => {
  // Am has A, A7 and Am7 available, so a same-root distractor must appear.
  const pool = poolForLevel('all');
  const r = rand();
  const distractors = pickDistractors(chord('Am'), pool, 3, r);
  assert.ok(
    distractors.some((d) => rootOf(d.name) === 'A'),
    `expected an A-rooted distractor, got ${distractors.map((d) => d.name).join(', ')}`
  );
});

test('distractors still fill up when the pool is barely big enough', () => {
  const tiny = ['Em', 'Am', 'C', 'G'].map(chord);
  const got = pickDistractors(chord('Em'), tiny, 3, rand());
  assert.equal(got.length, 3);
  assert.equal(new Set(got.map((g) => g.name)).size, 3);
});

test('a round is the requested length and rotates through the modes', () => {
  const quiz = buildQuiz(9, 'beginner', rand());
  assert.equal(quiz.length, 9);
  for (let i = 0; i < quiz.length; i++) {
    assert.equal(quiz[i].mode, QUIZ_MODES[i % QUIZ_MODES.length]);
  }
});

test('the same chord never comes up twice in a row', () => {
  // Run several seeds: the repeat only shows up when a bag refills.
  for (let seed = 1; seed <= 25; seed++) {
    const quiz = buildQuiz(40, 'beginner', mulberry32(seed));
    for (let i = 1; i < quiz.length; i++) {
      assert.notEqual(
        quiz[i].answer.name,
        quiz[i - 1].answer.name,
        `seed ${seed}: ${quiz[i].answer.name} repeated at question ${i}`
      );
    }
  }
});

test('a round draws on a spread of chords rather than a handful', () => {
  const quiz = buildQuiz(10, 'beginner', rand());
  const distinct = new Set(quiz.map((q) => q.answer.name));
  assert.equal(distinct.size, 10, 'every answer in a 10-question round should differ');
});

test('the same seed builds the same quiz', () => {
  const a = buildQuiz(10, 'beginner', mulberry32(7));
  const b = buildQuiz(10, 'beginner', mulberry32(7));
  assert.deepEqual(
    a.map((q) => [q.mode, q.answer.name, q.options.map((o) => o.name)]),
    b.map((q) => [q.mode, q.answer.name, q.options.map((o) => o.name)])
  );
});

test('different seeds build different quizzes', () => {
  const a = buildQuiz(10, 'beginner', mulberry32(1)).map((q) => q.answer.name);
  const b = buildQuiz(10, 'beginner', mulberry32(2)).map((q) => q.answer.name);
  assert.notDeepEqual(a, b);
});

test('a beginner round never asks about a barre chord', () => {
  const quiz = buildQuiz(30, 'beginner', rand());
  for (const q of quiz) {
    assert.equal(isBarreChord(q.answer), false, `${q.answer.name} is a barre`);
    for (const o of q.options) {
      assert.equal(isBarreChord(o), false, `${o.name} offered as an option`);
    }
  }
});

test('scoring rewards a streak but caps the bonus', () => {
  assert.equal(scoreForAnswer(0), 10);
  assert.equal(scoreForAnswer(1), 12);
  assert.equal(scoreForAnswer(5), 20);
  assert.equal(scoreForAnswer(50), 20, 'bonus should be capped');
});
