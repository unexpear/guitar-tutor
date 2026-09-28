import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionColumns, Layout } from '../constants/Layout';
import { signalHelp } from '../features/tuner/signalHelp';
import { boundedThumbnails, readThumbnailCache, thumbnailKey, THUMBNAIL_CACHE_LIMIT } from '../features/games/locker/thumbnailCache';
import { GUITAR_DESIGNS } from '../features/progression/guitarDesigns';
import { LESSON_SUMMARIES } from '../features/lessons/data/lessonSummaries';
import { dailyGiftStatus } from '../features/games/locker/dailyGiftStatus';

test('gift status explains the seventh claim, missed days and clock changes without changing eligibility', () => {
  assert.deepEqual(dailyGiftStatus(null, 0, '2026-09-19'), { claimed: false, futureDate: false, streak: 0, claimsUntilRare: 7 });
  assert.equal(dailyGiftStatus('2026-09-18', 6, '2026-09-19').claimsUntilRare, 1);
  assert.equal(dailyGiftStatus('2026-09-19', 6, '2026-09-19').claimsUntilRare, 1);
  assert.equal(dailyGiftStatus('2026-09-19', 7, '2026-09-19').claimsUntilRare, 7);
  assert.equal(dailyGiftStatus('2026-09-17', 6, '2026-09-19').claimsUntilRare, 7);
  assert.equal(dailyGiftStatus('2026-09-17', 6, '2026-09-19').streak, 0);
  assert.equal(dailyGiftStatus('2026-09-20', 7, '2026-09-19').futureDate, true);
  assert.equal(dailyGiftStatus('2026-09-20', 7, '2026-09-19').claimed, true);
});

test('collection columns preserve readable card widths at phone, tablet and large text sizes', () => {
  assert.equal(collectionColumns(393, 1), 2);
  assert.equal(collectionColumns(320, 1), 1);
  assert.equal(collectionColumns(393, 1.7), 1);
  assert.equal(collectionColumns(2000, 1), 5);
  for (const width of [320, 360, 393, 600, 768, 960, 1200]) for (const fontScale of [1, 1.3, 1.7, 2]) {
    const columns = collectionColumns(width, fontScale);
    const cardWidth = (Math.min(width, Layout.contentWidth) - Layout.page * 2 - Layout.gap * (columns - 1)) / columns;
    assert.ok(columns >= 1 && columns <= 5);
    if (columns > 1) assert.ok(cardWidth >= 152 * fontScale);
    assert.ok(cardWidth > 0);
  }
});

test('signal help never diagnoses inactive input as an audio measurement', () => {
  const idle = signalHelp({ active: false, starting: false, signal: 'quiet' });
  assert.match(idle.title, /stopped/);
  assert.match(idle.advice, /No sound is being measured/);
  assert.match(signalHelp({ active: false, starting: true, signal: 'idle' }).title, /Starting/);
  assert.match(signalHelp({ active: false, starting: false, signal: 'idle', error: 'Permission denied.' }).advice, /Permission denied/);
  for (const signal of ['quiet', 'noisy', 'clear', 'unstable']) {
    const result = signalHelp({ active: true, starting: false, signal });
    assert.ok(result.advice.length > 20);
    assert.doesNotMatch(result.title, /stopped/);
  }
});

test('thumbnail identity tracks procedural finishes and keeps imported finishes fixed', () => {
  const original = GUITAR_DESIGNS[0];
  const changed = { ...original, faceMid: '#ff0022' };
  assert.notEqual(thumbnailKey('acoustic-grand', original), thumbnailKey('acoustic-grand', changed));
  assert.notEqual(thumbnailKey('acoustic-grand', original), thumbnailKey('acoustic-cutaway', original));
  assert.equal(thumbnailKey('acoustic-classical', original), thumbnailKey('acoustic-classical', changed));
});

test('thumbnail cache is bounded, expendable, and rejects malformed entries', () => {
  const uri = 'data:image/jpeg;base64,' + 'A'.repeat(18000);
  const entries = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key-${i}`, uri]));
  const limited = boundedThumbnails(entries);
  assert.ok(JSON.stringify(limited).length <= THUMBNAIL_CACHE_LIMIT);
  assert.ok(Object.keys(limited).length <= 48);
  assert.equal(limited['key-99'], uri);
  assert.equal(limited['key-0'], undefined);
  for (const value of [null, 'garbage', '[]', 'null', '{"evil":"https://example.org/not-a-guitar"}', 'A'.repeat(THUMBNAIL_CACHE_LIMIT + 1)]) assert.deepEqual(readThumbnailCache(value), {});
  assert.deepEqual(readThumbnailCache(JSON.stringify({ sample: uri })), { sample: uri });
  assert.deepEqual(boundedThumbnails({ oversized: uri.repeat(4) }), {});
});

test('all 19 lessons have short catalog copy separate from their full instruction', () => {
  assert.equal(Object.keys(LESSON_SUMMARIES).length, 19);
  for (const copy of Object.values(LESSON_SUMMARIES)) assert.ok(copy.length >= 20 && copy.length <= 90);
});
