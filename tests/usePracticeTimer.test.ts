import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeClock } from '../features/practice/practiceClock';

// The store integration test imports progressStore, which pulls in
// AsyncStorage at module scope; mock it before that can happen.
const mem = new Map<string, string>();
mock.module('@react-native-async-storage/async-storage', {
  // Node 20 (the CI runtime) supports defaultExport, but not the newer
  // `exports: { default: ... }` spelling introduced in later Node releases.
  defaultExport: {
    getItem: async (key: string) => (mem.has(key) ? mem.get(key)! : null),
    setItem: async (key: string, value: string) => void mem.set(key, value),
    removeItem: async (key: string) => void mem.delete(key),
  },
});

/**
 * The accounting model is pure wall-clock time. These tests prove the
 * invariant "accumulated practice == sum of foreground wall-clock intervals",
 * not "timer callbacks x interval" — a stalled or throttled JS thread must
 * neither lose nor inflate practice time.
 */

function fakeNow() {
  let t = 0;
  return { now: () => t, advance: (ms: number) => void (t += ms) };
}

test('elapsed time is measured against the wall clock, not ticks', () => {
  const { now, advance } = fakeNow();
  const records: number[] = [];
  const clock = createPracticeClock({ now, record: (s) => records.push(s) });

  clock.begin();
  // 100 seconds pass with no timer callback at all (stalled thread, or the
  // interval simply never fired). The one flush still captures all of it.
  advance(100_000);
  clock.flush();

  assert.equal(records.length, 1);
  assert.equal(records[0], 100);
  assert.equal(clock.accumulatedSeconds, 100);
});

test('how many times the interval fires does not change the total', () => {
  const { now, advance } = fakeNow();
  const records: number[] = [];
  const clock = createPracticeClock({ now, record: (s) => records.push(s) });

  clock.begin();
  advance(30_000);
  clock.flush(); // ordinary tick
  advance(30_000);
  clock.flush(); // ordinary tick

  assert.deepEqual(records, [30, 30]);
  assert.equal(clock.accumulatedSeconds, 60);
});

test('a missed interval is caught up on the next flush as one chunk', () => {
  const { now, advance } = fakeNow();
  const records: number[] = [];
  const clock = createPracticeClock({ now, record: (s) => records.push(s) });

  clock.begin();
  advance(60_000); // interval callback was throttled away entirely
  clock.flush();

  assert.deepEqual(records, [60]);
});

test('sub-second toggling is noise and never recorded, but still counts toward the open interval', () => {
  const { now, advance } = fakeNow();
  const records: number[] = [];
  const clock = createPracticeClock({ now, record: (s) => records.push(s) });

  clock.begin();
  advance(500);
  clock.flush();
  clock.pause();
  clock.begin();
  advance(400);
  clock.dispose();

  assert.deepEqual(records, []);
  assert.equal(clock.accumulatedSeconds, 0);
});

test('accumulatedSeconds includes the interval still open', () => {
  const { now, advance } = fakeNow();
  const clock = createPracticeClock({ now });

  clock.begin();
  advance(12_000);

  assert.equal(clock.accumulatedSeconds, 12);
});

test('pause settles the open interval exactly once, then records nothing further', () => {
  const { now, advance } = fakeNow();
  const records: number[] = [];
  const clock = createPracticeClock({ now, record: (s) => records.push(s) });

  clock.begin();
  advance(10_000);
  clock.pause();
  clock.pause(); // already settled
  advance(5_000);
  clock.flush(); // not running

  assert.deepEqual(records, [10]);
  assert.equal(clock.accumulatedSeconds, 10);
  assert.equal(clock.running, false);
});

test('begin is idempotent and never re-anchors a running interval', () => {
  const { now, advance } = fakeNow();
  const clock = createPracticeClock({ now });

  clock.begin();
  advance(5_000);
  clock.begin(); // must not restart the clock and lose the 5s
  advance(5_000);
  clock.pause();

  assert.equal(clock.accumulatedSeconds, 10);
});

test('resume after a pause starts a fresh interval: the gaps are summed, not counted', () => {
  const { now, advance } = fakeNow();
  const records: number[] = [];
  const clock = createPracticeClock({ now, record: (s) => records.push(s) });

  clock.begin();
  advance(10_000);
  clock.pause(); // 10s banked
  advance(20_000); // paused: nothing
  clock.resume();
  advance(5_000);
  clock.dispose(); // 5s banked

  assert.deepEqual(records, [10, 5]);
  assert.equal(clock.accumulatedSeconds, 15);
});

test('backgrounding settles immediately and foreground never credits the gap', () => {
  const { now, advance } = fakeNow();
  const records: number[] = [];
  const clock = createPracticeClock({ now, record: (s) => records.push(s) });

  clock.begin();
  advance(60_000);
  clock.handleAppState('background'); // settles 60s
  assert.equal(clock.running, false);
  advance(120_000); // 2 minutes backgrounded
  clock.handleAppState('active'); // re-anchor at now, not a credit
  advance(20_000);
  clock.pause();

  assert.deepEqual(records, [60, 20]);
  assert.equal(clock.accumulatedSeconds, 80);
});

test('dispose settles once and never records twice', () => {
  const { now, advance } = fakeNow();
  const records: number[] = [];
  const clock = createPracticeClock({ now, record: (s) => records.push(s) });

  clock.begin();
  advance(15_000);
  clock.dispose();
  clock.dispose();
  clock.flush();

  assert.deepEqual(records, [15]);
  assert.equal(clock.running, false);
});

test('the clock feeds the real progress store: wall time lands in practiceLog', async (t) => {
  t.mock.timers.enable({
    apis: ['Date'],
    now: new Date(2026, 2, 15, 12, 0, 0).getTime(),
  });

  const { useProgressStore } = await import('../features/store/progressStore');

  const clock = createPracticeClock({
    record: useProgressStore.getState().recordPractice,
  });

  clock.begin();
  t.mock.timers.tick(60_000);
  clock.flush();

  assert.equal(useProgressStore.getState().practiceSecondsToday(), 60);
  assert.equal(useProgressStore.getState().totalPracticeMinutes, 1);
});
