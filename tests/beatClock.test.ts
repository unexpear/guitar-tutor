import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';

import {
  createBeatClock,
  gradeTiming,
  timingOffsetMs,
} from '../features/timing/beatClock';

/**
 * Advance fake time in small slices. A single large tick() does not drain
 * timers that the fired callback schedules, and this clock reschedules itself
 * on every beat, so stepping is the only way to see the whole sequence.
 */
function advance(ctx: TestContext, ms: number, step = 5) {
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    ctx.mock.timers.tick(Math.min(step, ms - elapsed));
  }
}

/** Run a clock on fake timers for `ms` of virtual time. */
function runClock(
  opts: Parameters<typeof createBeatClock>[0],
  ms: number,
  ctx: TestContext
) {
  ctx.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const clock = createBeatClock(opts);
  clock.start();
  advance(ctx, ms);
  clock.stop();
}

test('fires one beat per interval at the requested tempo', (t: TestContext) => {
  const beats: number[] = [];
  runClock(
    {
      getBpm: () => 120,
      getBeatsPerBar: () => 4,
      onBeat: (b) => beats.push(b),
    },
    // 2000ms at 120bpm (500ms/beat): t=0, 500, 1000, 1500, 2000
    2000,
    t
  );
  assert.equal(beats.length, 5);
});

test('cycles the beat index within the bar', (t: TestContext) => {
  const beats: number[] = [];
  runClock(
    {
      getBpm: () => 120,
      getBeatsPerBar: () => 3,
      onBeat: (b) => beats.push(b),
    },
    2500,
    t
  );
  assert.deepEqual(beats, [0, 1, 2, 0, 1, 2]);
});

test('reads tempo fresh on every tick so changes need no restart', (t: TestContext) => {
  let bpm = 60;
  const at: number[] = [];
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const clock = createBeatClock({
    getBpm: () => bpm,
    getBeatsPerBar: () => 4,
    onBeat: () => at.push(Date.now()),
  });
  clock.start();
  advance(t, 1000); // beats at 0 and 1000, one second apart
  bpm = 240; // 250ms/beat from here
  // The beat at 2000 was already scheduled at the old tempo; the change bites
  // from the beat after it.
  advance(t, 2000);
  clock.stop();
  assert.deepEqual(at, [0, 1000, 2000, 2250, 2500, 2750, 3000]);
});

test('does not accumulate drift over many beats', (t: TestContext) => {
  const at: number[] = [];
  runClock(
    {
      getBpm: () => 137, // interval is not a round number of ms
      getBeatsPerBar: () => 4,
      onBeat: (_b, scheduledAt) => at.push(scheduledAt),
    },
    30_000,
    t
  );
  const interval = (60 / 137) * 1000;
  assert.ok(at.length > 60, `only ${at.length} beats in 30s`);
  const last = at[at.length - 1];
  const ideal = (at.length - 1) * interval;
  assert.ok(
    Math.abs(last - ideal) < 1,
    `beat ${at.length} drifted to ${last}ms, ideal ${ideal}ms`
  );
});

test('resyncs after a stall instead of firing a burst of missed beats', (t: TestContext) => {
  const at: number[] = [];
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const clock = createBeatClock({
    getBpm: () => 120,
    getBeatsPerBar: () => 4,
    onBeat: () => at.push(Date.now()),
  });
  clock.start();
  advance(t, 500); // beats at 0 and 500
  const before = at.length;
  // Simulate the JS thread being frozen for 5 seconds (app backgrounded).
  t.mock.timers.tick(5000);
  advance(t, 20);
  clock.stop();
  const during = at.length - before;
  // A naive drift-corrected loop would fire all 10 missed beats immediately.
  assert.ok(during <= 10, `burst of ${during} beats after a stall`);
  // Consecutive beats must never land on the same instant.
  for (let i = 1; i < at.length; i++) {
    assert.notEqual(at[i], at[i - 1], 'two beats fired at the same instant');
  }
});

test('counts in before reporting bar positions', (t: TestContext) => {
  const counts: number[] = [];
  const beats: number[] = [];
  let started = 0;
  runClock(
    {
      getBpm: () => 120,
      getBeatsPerBar: () => 4,
      countInBeats: 4,
      onCountIn: (r) => counts.push(r),
      onStart: () => (started += 1),
      onBeat: (b) => beats.push(b),
    },
    2000,
    t
  );
  assert.deepEqual(counts, [4, 3, 2, 1]);
  assert.equal(started, 1);
  assert.deepEqual(beats, [0]); // only the beat at t=2000 is a real beat
});

test('stop() halts the clock', (t: TestContext) => {
  let n = 0;
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const clock = createBeatClock({
    getBpm: () => 120,
    getBeatsPerBar: () => 4,
    onBeat: () => (n += 1),
  });
  clock.start();
  advance(t, 500);
  assert.equal(clock.isRunning(), true);
  clock.stop();
  const after = n;
  advance(t, 5000);
  assert.equal(n, after);
  assert.equal(clock.isRunning(), false);
});

test('start() twice does not leave two loops running', (t: TestContext) => {
  let n = 0;
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const clock = createBeatClock({
    getBpm: () => 120,
    getBeatsPerBar: () => 4,
    onBeat: () => (n += 1),
  });
  clock.start();
  clock.start(); // restarting re-fires the downbeat, then replaces the loop
  advance(t, 2000);
  clock.stop();
  // One loop over 2000ms at 120bpm is 5 beats, plus the re-fired downbeat.
  // Two loops left running would be 10.
  assert.equal(n, 6, 'a second start() left the first loop running');
});

test('survives a zero or negative bpm without spinning', (t: TestContext) => {
  let n = 0;
  runClock(
    {
      getBpm: () => 0,
      getBeatsPerBar: () => 0,
      onBeat: () => (n += 1),
    },
    3000,
    t
  );
  // Clamped to 1bpm (60s/beat), so only the immediate first beat lands.
  assert.equal(n, 1);
});

test('grades timing with beginner-friendly windows', () => {
  assert.equal(gradeTiming(0), 'perfect');
  assert.equal(gradeTiming(-60), 'perfect');
  assert.equal(gradeTiming(60), 'perfect');
  assert.equal(gradeTiming(-140), 'good');
  assert.equal(gradeTiming(140), 'good');
  assert.equal(gradeTiming(-141), 'early');
  assert.equal(gradeTiming(141), 'late');
});

test('timing offset is negative when rushing, positive when dragging', () => {
  assert.equal(timingOffsetMs(950, 1000), -50);
  assert.equal(timingOffsetMs(1050, 1000), 50);
});
