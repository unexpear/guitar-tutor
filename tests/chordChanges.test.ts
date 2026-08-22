import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getChord } from '../features/chords/data/chords';
import { isBarreChord } from '../features/games/chordQuiz/quiz';
import {
  ROUND_SECONDS,
  SUGGESTED_PAIRS,
  pairKey,
  pickerChords,
  rateChanges,
  ratingBlurb,
} from '../features/games/chordChanges/changes';

test('a round is the traditional minute', () => {
  assert.equal(ROUND_SECONDS, 60);
});

test('the pair key does not care which chord you named first', () => {
  assert.equal(pairKey('Em', 'Am'), pairKey('Am', 'Em'));
  assert.notEqual(pairKey('Em', 'Am'), pairKey('Em', 'C'));
});

test('the pair key is namespaced so it cannot collide with a game id', () => {
  assert.ok(pairKey('Em', 'Am').startsWith('chord-changes:'));
});

test('every suggested pair is two different chords that exist', () => {
  for (const [a, b] of SUGGESTED_PAIRS) {
    assert.notEqual(a, b, 'a pair of the same chord is not a change');
    assert.ok(getChord(a), `${a} is not in the chord library`);
    assert.ok(getChord(b), `${b} is not in the chord library`);
  }
});

test('suggested pairs are not duplicated, in either order', () => {
  const seen = new Set<string>();
  for (const [a, b] of SUGGESTED_PAIRS) {
    const key = pairKey(a, b);
    assert.ok(!seen.has(key), `${a}/${b} is suggested twice`);
    seen.add(key);
  }
});

test('the suggestions start with pairs a beginner can actually play', () => {
  // The first few are what a new player is offered before they scroll.
  for (const [a, b] of SUGGESTED_PAIRS.slice(0, 5)) {
    for (const name of [a, b]) {
      const chord = getChord(name);
      if (!chord) throw new Error(`${name} missing`);
      if (name === 'F') continue; // C-F is a deliberate step up
      assert.equal(
        isBarreChord(chord),
        false,
        `${name} is a barre chord, too early in the suggestion list`
      );
    }
  }
});

test('the picker offers every chord, open shapes first', () => {
  const offered = pickerChords();
  assert.ok(offered.length >= 30, `only ${offered.length} chords offered`);
  const firstBarre = offered.findIndex((c) => isBarreChord(c));
  const lastOpen = offered.map((c) => isBarreChord(c)).lastIndexOf(false);
  assert.ok(firstBarre > lastOpen, 'open chords should all come before barres');
});

test('ratings step up at the numbers teachers quote', () => {
  assert.equal(rateChanges(0), 'starting');
  assert.equal(rateChanges(19), 'starting');
  assert.equal(rateChanges(20), 'getting there');
  assert.equal(rateChanges(39), 'getting there');
  assert.equal(rateChanges(40), 'solid');
  assert.equal(rateChanges(59), 'solid');
  assert.equal(rateChanges(60), 'fluent');
  assert.equal(rateChanges(200), 'fluent');
});

test('every rating has something to say', () => {
  for (const n of [0, 25, 45, 80]) {
    const blurb = ratingBlurb(rateChanges(n));
    assert.ok(blurb.length > 30, `blurb for ${n} is too thin`);
  }
});
