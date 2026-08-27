import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMicReleaseGuard } from '../features/audio/micGuard';

const recording = () => {
  const calls: string[] = [];
  const stop = () => void calls.push('stop');
  return { calls, stop };
};

test('blur releases the mic exactly once when something is running', () => {
  const { calls, stop } = recording();
  const guard = createMicReleaseGuard(stop, true);

  guard.onBlur();

  assert.deepEqual(calls, ['stop']);
});

test('blur leaves the mic alone when nothing is running', () => {
  const { calls, stop } = recording();
  const guard = createMicReleaseGuard(stop, false);

  guard.onBlur();

  assert.deepEqual(calls, []);
});

test('backgrounding releases the mic exactly once when running', () => {
  const { calls, stop } = recording();
  const guard = createMicReleaseGuard(stop, true);

  guard.onAppStateChange('background');

  assert.deepEqual(calls, ['stop']);
});

test('returning to the foreground never releases the mic', () => {
  const { calls, stop } = recording();
  const guard = createMicReleaseGuard(stop, true);

  guard.onAppStateChange('active');

  assert.deepEqual(calls, [], 'an already-running tuner must keep running');
});

test('backgrounding while idle does not prod an already-released tuner', () => {
  const { calls, stop } = recording();
  // The tuner already stopped; this guard was created with isRunning === false
  // (the hook recreates it when the engine state flips). It must not fight it.
  const guard = createMicReleaseGuard(stop, false);

  guard.onAppStateChange('background');
  guard.onAppStateChange('inactive');

  assert.deepEqual(calls, []);
});

test('stale-closure parity: a guard captured while running still releases later', () => {
  const { calls, stop } = recording();
  const guard = createMicReleaseGuard(stop, true);
  // The tuner has since stopped, but this guard was created before that
  // render — exactly the closure the old effect would hold. It releases.
  guard.onBlur();
  assert.deepEqual(calls, ['stop']);

  // The next render of the hook creates a fresh guard with the new value,
  // which is silent going forwards (test above).
  const fresh = createMicReleaseGuard(stop, false);
  fresh.onBlur();
  fresh.onAppStateChange('background');
  assert.deepEqual(calls, ['stop']);
});

test('the guard fires one release per losing-focus event', () => {
  const { calls, stop } = recording();
  const guard = createMicReleaseGuard(stop, true);

  guard.onBlur();
  guard.onBlur();

  // React fires the focus cleanup once per blur. A second forged blur on the
  // same (still-running) guard also releases, which is faithful closure
  // behaviour; the defence against a genuinely double-stopped tuner is that
  // the first stop flips the engine, and the hook then recreates the guard
  // as idle (covered by the stale-closure tests above).
  assert.deepEqual(calls, ['stop', 'stop']);
});

test('a second background transition while still running fires once more, matching the live engine', () => {
  const { calls, stop } = recording();
  const guard = createMicReleaseGuard(stop, true);

  guard.onAppStateChange('background');
  guard.onAppStateChange('background');

  // Each real background transition fires the listener once. If the engine
  // were still running this is exactly one release per transition; in
  // reality it stops on the first and the hook recreates the guard as idle.
  assert.deepEqual(calls, ['stop', 'stop']);
});