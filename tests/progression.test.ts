import test from 'node:test';
import assert from 'node:assert/strict';
import {
  levelFromXp,
  levelProgress,
  xpForFirstLesson,
  xpForGameScore,
} from '../features/progression/playerProgress';
import {
  GUITAR_DESIGNS,
  guitarDesign,
  isDesignUnlocked,
} from '../features/progression/guitarDesigns';

test('XP produces predictable 100-point levels and progress', () => {
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(99), 1);
  assert.equal(levelFromXp(100), 2);
  assert.deepEqual(levelProgress(245), {
    level: 3,
    xpIntoLevel: 45,
    xpForNextLevel: 100,
    percent: 45,
  });
  assert.equal(levelFromXp(Number.NaN), 1);
});

test('round and lesson XP rewards are bounded', () => {
  assert.equal(xpForGameScore(0), 0);
  assert.equal(xpForGameScore(100), 70);
  assert.equal(xpForGameScore(900), 70);
  assert.equal(xpForFirstLesson(100), 75);
  assert.equal(xpForFirstLesson(-20), 50);
});

test('locker has ten free and thirty level-locked designs', () => {
  assert.equal(GUITAR_DESIGNS.length, 40);
  assert.equal(GUITAR_DESIGNS.filter((design) => design.unlockLevel === 1).length, 10);
  assert.equal(GUITAR_DESIGNS.filter((design) => design.unlockLevel > 1).length, 30);
  assert.equal(GUITAR_DESIGNS.at(-1)?.unlockLevel, 31);
  assert.equal(GUITAR_DESIGNS.filter((design) => isDesignUnlocked(design, 1)).length, 10);
  assert.equal(GUITAR_DESIGNS.filter((design) => isDesignUnlocked(design, 31)).length, 40);
  assert.equal(GUITAR_DESIGNS.filter((design) => design.guitarType === 'acoustic').length, 20);
  assert.equal(GUITAR_DESIGNS.filter((design) => design.guitarType === 'electric').length, 20);
  assert.equal(guitarDesign('missing').id, GUITAR_DESIGNS[0].id);
});
