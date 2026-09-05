import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TargetMatcher, Target } from '../features/lessons/playalong/matcher';

const f = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** A pitch sample: loud, confident, and at time `t` unless told otherwise. */
const S = (midi: number, t = 0, conf = 0.9, rmsDb = -20) => ({
  frequency: f(midi),
  confidence: conf,
  rmsDb,
  tMs: t,
});

const noteTarget: Target = { kind: 'note', stringIndex: 0, fret: 0, label: 'E' };
const em = (): Target => ({ kind: 'chord', chordName: 'Em', label: 'Em' });

test('capo scoring accepts the sounding root, not the uncapoed shape root', () => {
  const target: Target = {kind: 'chord', chordName: 'Bb', label: 'Bb', capo: 2};
  const correct = new TargetMatcher(target, {mode: 'mono'});
  assert.equal(correct.feed(S(48, 0)), null);
  assert.equal(correct.feed(S(48, 40)), 'hit');
  const incorrect = new TargetMatcher(target, {mode: 'mono'});
  const outcomes = Array.from({length: 12}, (_, i) => incorrect.feed(S(46, i * 40)));
  assert.ok(!outcomes.includes('hit'));
  assert.ok(outcomes.includes('wrong'));
});

test('a note needs two consistent frames before it counts', () => {
  const m = new TargetMatcher(noteTarget);
  assert.equal(m.feed(S(40.1)), null);
  assert.equal(m.feed(S(39.95)), 'hit');
});

test('note matching follows a calibrated reference pitch', () => {
  const referencePitchHz = 450;
  const calibratedFrequency = (midi: number) =>
    referencePitchHz * Math.pow(2, (midi - 69) / 12);
  const matcher = new TargetMatcher(noteTarget, {
    referencePitchHz,
    noteToleranceCents: 5,
  });
  const sample = {
    frequency: calibratedFrequency(40),
    confidence: 0.9,
    rmsDb: -20,
    tMs: 0,
  };

  assert.equal(matcher.feed(sample), null);
  assert.equal(matcher.feed({ ...sample, tMs: 40 }), 'hit');
});

test('a sustained wrong note reports wrong', () => {
  const m = new TargetMatcher(noteTarget);
  let ev = null;
  for (let i = 0; i < 4; i++) ev = m.feed(S(45, i * 40));
  assert.equal(ev, 'wrong');
});

test('the same note an octave up is accepted', () => {
  const m = new TargetMatcher(noteTarget);
  m.feed(S(52));
  assert.equal(m.feed(S(52)), 'hit');
});

test('low-confidence frames are ignored', () => {
  const m = new TargetMatcher(noteTarget);
  assert.equal(m.feed(S(40, 0, 0.2)), null);
  assert.equal(m.feed(S(40, 40, 0.2)), null);
});

test('mono chord mode accepts any single chord tone', () => {
  const m = new TargetMatcher(em(), { mode: 'mono' });
  m.feed(S(59));
  assert.equal(m.feed(S(59)), 'hit');
});

test('poly mode rejects one string held forever', () => {
  const m = new TargetMatcher(em(), { mode: 'poly' });
  let hit = false;
  for (let i = 0; i < 10; i++) if (m.feed(S(40, i * 50)) === 'hit') hit = true;
  assert.equal(hit, false);
});

test('poly mode hits on three distinct classes including the bass', () => {
  const m = new TargetMatcher(em(), { mode: 'poly' });
  m.feed(S(40, 0));
  m.feed(S(59, 100));
  assert.equal(m.feed(S(55, 200)), 'hit');
});

test('poly mode will not hit without the bass note', () => {
  const m = new TargetMatcher(em(), { mode: 'poly' });
  m.feed(S(55, 0));
  m.feed(S(59, 80));
  m.feed(S(55, 160));
  assert.notEqual(m.feed(S(59, 240)), 'hit');
});

test('poly evidence expires so a stale window cannot bank a hit', () => {
  const m = new TargetMatcher(em(), { mode: 'poly' });
  m.feed(S(40, 0));
  m.feed(S(59, 4000));
  m.feed(S(55, 4100));
  assert.equal(m.feed(S(40, 4200)), 'hit');
});

test('poly wrong clears the accumulated evidence', () => {
  const m = new TargetMatcher(em(), { mode: 'poly' });
  m.feed(S(40, 0));
  m.feed(S(59, 50));
  let ev = null;
  for (let i = 0; i < 4; i++) ev = m.feed(S(49, 100 + i * 30));
  assert.equal(ev, 'wrong');
  assert.equal(m.state().heardClasses.length, 0);
});

test('poly mode works for G as well as Em', () => {
  const m = new TargetMatcher({ kind: 'chord', chordName: 'G', label: 'G' }, { mode: 'poly' });
  m.feed(S(43, 0));
  m.feed(S(47, 60));
  assert.equal(m.feed(S(50, 120)), 'hit');
});

test('a quiet ring-out does not re-trigger as a fresh attack', () => {
  const m = new TargetMatcher({ ...noteTarget, kind: 'note' });
  // Loud attack lands the hit.
  m.feed(S(40, 0, 0.9, -20));
  assert.equal(m.feed(S(40, 40, 0.9, -20)), 'hit');
  // The string keeps ringing, quieter and quieter: no second attack.
  let extra = 0;
  for (let i = 1; i <= 10; i++) {
    if (m.feed(S(40, 40 + i * 40, 0.9, -20 - i * 3)) === 'hit') extra += 1;
  }
  assert.equal(extra, 0, 'a decaying ring counted as new strums');
});
