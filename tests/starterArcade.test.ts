import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STRING_NAMES,
  STARTER_ROUND_LENGTH,
  starterFeedback,
  starterRoundScore,
  stringQuestion,
  tuneChoiceForCents,
  tuneQuestion,
} from '../features/games/starter/starterArcade';

test('tune sense teaches flat up, sharp down, and a centered tolerance', () => {
  assert.equal(tuneChoiceForCents(-20), 'Tune up');
  assert.equal(tuneChoiceForCents(-3), 'In tune');
  assert.equal(tuneChoiceForCents(3), 'In tune');
  assert.equal(tuneChoiceForCents(20), 'Tune down');
});

test('guided rounds are short, simpler, and cover every string once', () => {
  const questions = Array.from({ length: STARTER_ROUND_LENGTH.guided }, (_, round) =>
    stringQuestion(0.123, round, 'guided'),
  );
  assert.equal(new Set(questions.map((question) => question.answer)).size, 6);
  assert.ok(questions.every((question) => question.options.length === 3));
});

test('starter scores are percentages and teaching feedback explains the correction', () => {
  assert.equal(starterRoundScore(5, 6), 83);
  assert.equal(starterRoundScore(20, 6), 100);
  assert.equal(starterRoundScore(-2, 6), 0);
  assert.match(starterFeedback('tune-sense', 'Tune up', -16), /flat.*raise/i);
  assert.match(starterFeedback('tune-sense', 'Tune down', 17), /sharp.*lower/i);
  assert.match(starterFeedback('string-scout', STRING_NAMES[0]), /thinnest string \(1\)/i);
});

test('starter questions always include one valid answer', () => {
  for (let seedIndex = 0; seedIndex < 100; seedIndex += 1) {
    for (let round = 0; round < 30; round += 1) {
      const strings = stringQuestion(seedIndex / 101, round);
      assert.ok(STRING_NAMES.includes(strings.answer));
      assert.equal(strings.options.length, 4);
      assert.equal(new Set(strings.options).size, 4);
      assert.equal(strings.options.filter((option) => option === strings.answer).length, 1);

      const tuning = tuneQuestion(seedIndex / 101, round);
      assert.ok(tuning.options.includes(tuning.answer));
      assert.equal(tuning.answer, tuneChoiceForCents(tuning.cents));
    }
  }
});
