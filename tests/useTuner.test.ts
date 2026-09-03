import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  IDLE_STATE,
  mapTunerReading,
  targetFrequenciesFor,
  tunerEngineOptionsFor,
  TUNER_ENGINE_OPTIONS,
} from '../features/tuner/tunerReading';
import { TUNING_PRESETS } from '../features/tuner/data/tunings';
import { noteToFrequency } from '../features/tuner/data/tunings';

const STANDARD_E = TUNING_PRESETS[0];

function reading(patches: Partial<Parameters<typeof mapTunerReading>[0]> = {}) {
  return {
    hasPitch: true,
    noteName: 'A',
    octave: 4,
    cents: 0,
    confidence: 0.9,
    ...patches,
  };
}

function opts(patches: Partial<Parameters<typeof mapTunerReading>[1]> = {}) {
  return {
    isRunning: true,
    smoothHz: 0,
    targetStringIndex: null,
    tuning: STANDARD_E,
    stringFrequencies: targetFrequenciesFor(STANDARD_E),
    ...patches,
  };
}

test('TUNER_ENGINE_OPTIONS pins the current native-engine contract', () => {
  // Do not pass `instrument`: the dependency applies that preset after the
  // explicit config and would raise the floor above our C2/D2 tunings.
  assert.deepEqual(TUNER_ENGINE_OPTIONS, {
    a4: 440,
    minFrequency: 55,
    maxFrequency: 1400,
    confidenceThreshold: 0.75,
    noiseGateDb: -55,
    onsetDetection: true,
    emaAlpha: 0.42,
    hysteresisFrames: 2,
    hpfCutoffHz: 40,
    quality: 'balanced',
  });
  assert.ok(!('instrument' in TUNER_ENGINE_OPTIONS));
});

test('reference-pitch calibration reaches the engine and target maths', () => {
  assert.equal(tunerEngineOptionsFor(STANDARD_E, 442).a4, 442);
  const a440 = targetFrequenciesFor(STANDARD_E, 440)[1];
  const a442 = targetFrequenciesFor(STANDARD_E, 442)[1];
  assert.equal(a440, 110);
  assert.equal(a442, 110.5);
});

test('room profiles adjust the gate and confidence without changing instrument range', () => {
  const quiet = tunerEngineOptionsFor(STANDARD_E, 440, 'quiet');
  const normal = tunerEngineOptionsFor(STANDARD_E, 440, 'normal');
  const noisy = tunerEngineOptionsFor(STANDARD_E, 440, 'noisy');
  assert.equal(quiet.noiseGateDb, -60);
  assert.equal(normal.noiseGateDb, -55);
  assert.equal(noisy.noiseGateDb, -48);
  assert.ok((quiet.confidenceThreshold ?? 1) < (noisy.confidenceThreshold ?? 0));
  assert.equal(quiet.minFrequency, normal.minFrequency);
  assert.equal(noisy.maxFrequency, normal.maxFrequency);
  assert.equal(normal.emaAlpha, 0.32);
  assert.equal(normal.hysteresisFrames, 3);
});

test('not listening reads exactly the idle state', () => {
  assert.deepEqual(mapTunerReading(null, opts({ isRunning: false })), IDLE_STATE);
});

test('listening-but-havent-heard reads as active with neutral fields', () => {
  const cases: Parameters<typeof mapTunerReading>[0][] = [
    null,
    reading({ hasPitch: false }),
    reading({ hasPitch: true, noteName: 'A' }),
  ];
  for (const r of cases) {
    const state = mapTunerReading(r, opts({ smoothHz: 0 }));
    assert.equal(state.isActive, true, 'listening must read as active');
    assert.equal(state.stringIndex, null);
    assert.equal(state.targetCents, null);
    assert.equal(state.verdict, null);
    assert.equal(state.frequency, 0);
  }
});

test('a malformed frame is treated as "listening, nothing heard"', () => {
  const state = mapTunerReading(
    reading({ hasPitch: true, cents: Number.NaN }),
    opts({ smoothHz: Number.NaN }),
  );
  assert.equal(state.isActive, true);
  assert.equal(state.stringIndex, null);
  assert.equal(state.cents, 0, 'NaN cents must not leak into the readout');
});

test('quiet and noisy no-pitch frames produce useful signal guidance', () => {
  const quiet = mapTunerReading(
    reading({ hasPitch: false, rmsDb: -78 }),
    opts({ smoothHz: 0 }),
  );
  const noisy = mapTunerReading(
    reading({ hasPitch: false, rmsDb: -35 }),
    opts({ smoothHz: 0 }),
  );
  assert.equal(quiet.signal, 'quiet');
  assert.equal(noisy.signal, 'noisy');
});

test('low-confidence or wandering readings are withheld as unstable', () => {
  const target = noteToFrequency('E2');
  const weak = mapTunerReading(
    reading({ confidence: 0.74 }),
    opts({ smoothHz: target, targetStringIndex: 0 }),
  );
  const wandering = mapTunerReading(
    reading(),
    opts({ smoothHz: target, targetStringIndex: 0, spreadCents: 25 }),
  );
  assert.equal(weak.signal, 'unstable');
  assert.equal(weak.verdict, null);
  assert.equal(wandering.signal, 'unstable');
  assert.equal(wandering.verdict, null);
});

test('the JS confidence gate follows the selected room profile', () => {
  const target = noteToFrequency('E2');
  const quiet = mapTunerReading(
    reading({ confidence: 0.7 }),
    opts({ smoothHz: target, targetStringIndex: 0, minimumConfidence: 0.68 }),
  );
  const noisy = mapTunerReading(
    reading({ confidence: 0.7 }),
    opts({ smoothHz: target, targetStringIndex: 0, minimumConfidence: 0.82 }),
  );
  assert.equal(quiet.signal, 'clear');
  assert.equal(noisy.signal, 'unstable');
});

test('selected-string mode corrects an octave overtone without changing auto mode', () => {
  const target = noteToFrequency('E2');
  const selected = mapTunerReading(
    reading({ noteName: 'E', octave: 3 }),
    opts({ smoothHz: target * 2, targetStringIndex: 0 }),
  );
  const automatic = mapTunerReading(
    reading({ noteName: 'E', octave: 3 }),
    opts({ smoothHz: target * 2 }),
  );
  assert.equal(selected.frequency, target);
  assert.equal(selected.harmonicRatio, 2);
  assert.equal(selected.targetCents, 0);
  assert.equal(automatic.harmonicRatio, 1);
  assert.equal(automatic.frequency, target * 2);
});

test('chromatic mode grades the nearest semitone without a string target', () => {
  const chromatic = TUNING_PRESETS.find((preset) => preset.id === 'chromatic');
  assert.ok(chromatic);
  const state = mapTunerReading(
    reading({ noteName: 'C', octave: 4, cents: 7 }),
    opts({
      tuning: chromatic,
      stringFrequencies: [],
      smoothHz: noteToFrequency('C4') * 2 ** (7 / 1200),
    }),
  );
  assert.equal(state.nearestTarget, 'C4');
  assert.equal(state.targetCents, 7);
  assert.equal(state.verdict, 'close');
  assert.equal(state.stringIndex, null);
});

test('the selected in-tune window controls guided and chromatic verdicts', () => {
  const e2 = noteToFrequency('E2');
  const precise = mapTunerReading(
    reading(),
    opts({
      smoothHz: e2 * 2 ** (3 / 1200),
      targetStringIndex: 0,
      inTuneCents: 1,
    }),
  );
  assert.equal(precise.targetCents, 3);
  assert.equal(precise.verdict, 'close');

  const chromatic = TUNING_PRESETS.find((preset) => preset.id === 'chromatic');
  assert.ok(chromatic);
  const relaxed = mapTunerReading(
    reading({ noteName: 'A', octave: 4, cents: 5 }),
    opts({
      tuning: chromatic,
      stringFrequencies: [],
      smoothHz: 440 * 2 ** (5 / 1200),
      inTuneCents: 5,
    }),
  );
  assert.equal(relaxed.verdict, 'in-tune');
});

test('expert half-cent window keeps decimal precision through the verdict', () => {
  const e2 = noteToFrequency('E2');
  const exactEdge = mapTunerReading(
    reading(),
    opts({
      smoothHz: e2 * 2 ** (0.5 / 1200),
      targetStringIndex: 0,
      inTuneCents: 0.5,
    }),
  );
  assert.equal(exactEdge.targetCents, 0.5);
  assert.equal(exactEdge.verdict, 'in-tune');

  const outside = mapTunerReading(
    reading(),
    opts({
      smoothHz: e2 * 2 ** (0.6 / 1200),
      targetStringIndex: 0,
      inTuneCents: 0.5,
    }),
  );
  assert.equal(outside.targetCents, 0.6);
  assert.equal(outside.verdict, 'close');
});

test('every string of every preset maps its exact target to zero cents and in-tune', () => {
  for (const tuning of TUNING_PRESETS) {
    const stringFrequencies = targetFrequenciesFor(tuning);
    assert.equal(
      stringFrequencies.length,
      tuning.strings.length,
      `${tuning.name}: one target per string`
    );
    for (let i = 0; i < tuning.strings.length; i++) {
      const target = stringFrequencies[i];
      const state = mapTunerReading(
        reading({ noteName: tuning.strings[i] }),
        opts({
          tuning,
          stringFrequencies,
          smoothHz: target,
          targetStringIndex: i,
        }),
      );
      assert.equal(state.stringIndex, i, `${tuning.name} string ${i}`);
      assert.equal(state.nearestTarget, tuning.strings[i]);
      assert.equal(state.frequency, target);
      assert.equal(state.targetCents, 0, `${tuning.name} string ${i} cents`);
      assert.equal(state.verdict, 'in-tune', `${tuning.name} string ${i} verdict`);
      assert.equal(state.isActive, true);
    }
  }
});

test('aiming at a string pins the reading to that string, not the nearest', () => {
  // 82.41 (E2) vs 110.0 (A2): smack in between. Pinning to string 1 must
  // report an A2 deviation even though the pitch is closer to E2.
  const midEtoA = (82.41 + 110.0) / 2;
  const state = mapTunerReading(reading(), opts({ smoothHz: midEtoA, targetStringIndex: 1 }));
  assert.equal(state.stringIndex, 1);
  assert.equal(state.nearestTarget, 'A2');
  assert.ok(state.targetCents !== null && state.targetCents < 0, 'flat of A2');
  assert.equal(state.verdict, 'off');
});

test('auto-detect picks the nearest string within +-250 cents', () => {
  // 88 Hz is well below the pitch midpoint between E2 (82.41) and A2 (110.0),
  // so it reads ~+114 cents of E2, clearly its string.
  const state = mapTunerReading(reading(), opts({ smoothHz: 88 }));
  assert.equal(state.stringIndex, 0, 'closer to E2 than to A2');
  assert.equal(state.nearestTarget, 'E2');
});

test('a pitch past one string ceiling falls onto the next string, within its range', () => {
  // The +-250 cent rule applies per string, not to the whole fretboard. A
  // note 251 cents sharp of E2 is only 249 cents flat of A2 (the gap is ~500
  // cents), so auto-detect jumps to A2 rather than giving up.
  const e2 = noteToFrequency('E2');
  const shy = mapTunerReading(reading(), opts({ smoothHz: e2 * 2 ** (249 / 1200) }));
  assert.equal(shy.stringIndex, 0, 'within 250 cents matches the nearest string');
  const past = mapTunerReading(reading(), opts({ smoothHz: e2 * 2 ** (251 / 1200) }));
  assert.equal(past.stringIndex, 1);
  assert.equal(past.nearestTarget, 'A2');
  assert.ok(past.targetCents !== null && past.targetCents < 0, 'flat of A2');
});

test('one semitone sharp reads +100 cents and off', () => {
  const e2 = noteToFrequency('E2');
  const state = mapTunerReading(reading(), opts({ smoothHz: e2 * 2 ** (1 / 12), targetStringIndex: 0 }));
  assert.equal(state.targetCents, 100);
  assert.equal(state.verdict, 'off');
});

test('one semitone flat reads -100 cents and off', () => {
  const e2 = noteToFrequency('E2');
  const state = mapTunerReading(reading(), opts({ smoothHz: e2 / 2 ** (1 / 12), targetStringIndex: 0 }));
  assert.equal(state.targetCents, -100);
  assert.equal(state.verdict, 'off');
});

test('the +-50 cent display boundary still reads off', () => {
  // The readout is clamped to +-50 cents, but a reading any further out is
  // "off", not an inviting "close". At exactly 50 the rounded value is still
  // past the 10-cent threshold.
  const e2 = noteToFrequency('E2');
  const at50 = mapTunerReading(reading(), opts({ smoothHz: e2 * 2 ** (50 / 1200), targetStringIndex: 0 }));
  assert.equal(at50.targetCents, 50);
  assert.equal(at50.verdict, 'off');
  const at9 = mapTunerReading(reading(), opts({ smoothHz: e2 * 2 ** (9 / 1200), targetStringIndex: 0 }));
  assert.equal(at9.verdict, 'close');
  const at0 = mapTunerReading(reading(), opts({ smoothHz: e2, targetStringIndex: 0 }));
  assert.equal(at0.verdict, 'in-tune');
});

test('way below the tuner range reads as unmatched, not a broken note', () => {
  // A 20 Hz signal is a whole octave under E2 (41.2 -> 82.4).
  const state = mapTunerReading(reading(), opts({ smoothHz: 20 }));
  assert.equal(state.stringIndex, null);
  assert.equal(state.targetCents, null);
  assert.equal(state.verdict, null);
});

test('way above the tuner range reads as unmatched, not a broken note', () => {
  const state = mapTunerReading(reading(), opts({ smoothHz: 4000 }));
  assert.equal(state.stringIndex, null);
  assert.equal(state.targetCents, null);
  assert.equal(state.verdict, null);
});

test('the native fields pass straight through to the state', () => {
  const state = mapTunerReading(
    reading({ noteName: 'A', octave: 4, cents: -3, confidence: 0.87 }),
    opts({ smoothHz: noteToFrequency('A2'), targetStringIndex: 1 }),
  );
  assert.equal(state.note, 'A');
  assert.equal(state.octave, 4);
  assert.equal(state.cents, -3);
  assert.equal(state.confidence, 0.87);
});
