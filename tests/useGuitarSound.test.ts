import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSoundController,
  type SoundControllerDeps,
} from '../features/audio/soundController';

/** Stand-in for expo-audio's AudioPlayer. */
type FakePlayer = {
  asset: number | string;
  volume: number;
  played: number;
  released: boolean;
  releasedCount: number;
  play(): void;
  release(): void;
};

interface FakeEnv {
  controller: ReturnType<typeof createSoundController>;
  players: FakePlayer[];
  createdAssets: Array<number | string>;
  warns: string[];
  modeCalls: Array<Parameters<NonNullable<SoundControllerDeps['setAudioMode']>>[0]>;
  settings: { soundsEnabled: boolean; sampleVolume: number };
  scheduled: Array<{ at: number; fn: () => void; cancelled: boolean }>;
  fireAll(): void;
}

const SAMPLES: Record<string, string> = {
  C4: 'asset:C4',
  E4: 'asset:E4',
  G4: 'asset:G4',
  C3: 'asset:C3',
};

function makeEnv(overrides: Partial<SoundControllerDeps> = {}): FakeEnv {
  const players: FakePlayer[] = [];
  const createdAssets: Array<number | string> = [];
  const warns: string[] = [];
  const modeCalls: Array<Parameters<NonNullable<SoundControllerDeps['setAudioMode']>>[0]> = [];
  const settings = { soundsEnabled: true, sampleVolume: 80 };
  const scheduled: Array<{ at: number; fn: () => void; cancelled: boolean }> = [];
  let now = 0;

  const controller = createSoundController({
    createPlayer: (asset) => {
      createdAssets.push(asset);
      const player: FakePlayer = {
        asset,
        volume: 1,
        played: 0,
        released: false,
        releasedCount: 0,
        play() {
          this.played += 1;
        },
        release() {
          this.released = true;
          this.releasedCount += 1;
        },
      };
      players.push(player);
      return player;
    },
    resolveSample: (note) => SAMPLES[note] ?? null,
    getSettings: () => ({ ...settings }),
    setAudioMode: async (mode) => void modeCalls.push(mode),
    warn: (message) => void warns.push(message),
    timer: (fn, ms) => {
      const rec = { at: now + ms, fn, cancelled: false, cancel() { this.cancelled = true; } };
      scheduled.push(rec);
      return rec;
    },
    clearTimer: (handle) => handle.cancel(),
    ...overrides,
  });

  const fakeEnv: FakeEnv = {
    controller,
    players,
    createdAssets,
    warns,
    modeCalls,
    settings,
    scheduled,
    fireAll() {
      for (const rec of scheduled) {
        if (!rec.cancelled) rec.fn();
      }
    },
  };
  return fakeEnv;
}

test('configureMode requests the correct audio session and swallows rejection', async () => {
  const env = makeEnv();
  await env.controller.configureMode();
  assert.deepEqual(env.modeCalls, [
    {
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: false,
    },
  ]);

  const failing = makeEnv({
    setAudioMode: async () => {
      throw new Error('no audio session');
    },
  });
  await failing.controller.configureMode(); // resolves; nothing to assert
});

test('a silenced setting produces no players and no timers', async () => {
  const env = makeEnv();
  env.settings.soundsEnabled = false;

  await env.controller.playNote('C4');
  await env.controller.playChord(['C4', 'E4']);

  assert.equal(env.players.length, 0);
  assert.equal(env.scheduled.length, 0);
  assert.deepEqual(env.warns, []);
});

test('playNote picks the sample, sets the volume, and plays exactly once', async () => {
  const env = makeEnv();

  await env.controller.playNote('C4');

  assert.deepEqual(env.createdAssets, ['asset:C4']);
  assert.equal(env.players.length, 1);
  assert.equal(env.players[0].volume, 0.8);
  assert.equal(env.players[0].played, 1);
  assert.equal(env.players[0].released, false);
});

test('a second playNote releases the previous player exactly once', async () => {
  const env = makeEnv();

  await env.controller.playNote('C4');
  await env.controller.playNote('E4');

  assert.equal(env.players[0].released, true);
  assert.equal(env.players[0].releasedCount, 1);
  assert.equal(env.players[1].released, false);
});

test('a missing sample warns and produces no player', async () => {
  const env = makeEnv();

  await env.controller.playNote('A1');

  assert.equal(env.players.length, 0);
  assert.equal(env.warns.length, 1);
  assert.match(env.warns[0], /No audio sample for note: A1/);

  // the controller still works afterwards
  await env.controller.playNote('C4');
  assert.equal(env.players.length, 1);
});

test('playChord strums one player per sounding string, staggered in order', async () => {
  const env = makeEnv();

  await env.controller.playChord(['C4', 'E4', 'G4']);

  assert.equal(env.players.length, 3);
  assert.deepEqual(
    env.scheduled.map((r) => r.at),
    [0, 55, 110]
  );
  env.players.forEach((p) => assert.equal(p.played, 0, 'nothing played yet'));

  env.fireAll();

  env.players.forEach((p) => {
    assert.equal(p.played, 1);
    assert.equal(p.released, false, 'strummed players stay alive while ringing');
  });
  assert.equal(env.warns.length, 0);
});

test('strumming honours a custom stagger', async () => {
  const env = makeEnv();

  await env.controller.playChord(['C4', 'E4'], 33);

  assert.deepEqual(
    env.scheduled.map((r) => r.at),
    [0, 33]
  );
});

test('a missing string warns but the rest of the chord still rings', async () => {
  const env = makeEnv();

  await env.controller.playChord(['C4', 'A1', 'E4']);

  assert.equal(env.players.length, 2);
  assert.equal(env.warns.length, 1);
  assert.match(env.warns[0], /No audio sample for note: A1/);

  env.fireAll();
  env.players.forEach((p) => assert.equal(p.played, 1));
});

test('stopChord cancels the strum before it rings', async () => {
  const env = makeEnv();

  await env.controller.playChord(['C4', 'E4', 'G4']);
  env.controller.stopChord();
  env.fireAll();

  env.players.forEach((p) => {
    assert.equal(p.played, 0, 'cancelled strum never plays');
    assert.equal(p.released, true);
    assert.equal(p.releasedCount, 1);
  });
  assert.equal(env.scheduled.every((r) => r.cancelled), true);
});

test('a new chord supersedes the old one: cancelled, released, silent', async () => {
  const env = makeEnv();

  await env.controller.playChord(['C4', 'E4', 'G4']);
  const first = env.players.slice(0, 3);
  await env.controller.playChord(['C3', 'G4']);
  const second = env.players.slice(3);

  first.forEach((p) => assert.equal(p.released, true, 'superseded players released'));
  second.forEach((p) => assert.equal(p.released, false));

  env.fireAll();
  second.forEach((p) => assert.equal(p.played, 1));
});

test('releaseAll releases the single note and the chord, and is idempotent', async () => {
  const env = makeEnv();

  await env.controller.playNote('C4');
  await env.controller.playChord(['C4', 'E4']);
  env.controller.releaseAll();
  env.controller.releaseAll();

  assert.equal(env.players[0].released, true);
  assert.equal(env.players[0].releasedCount, 1);
  env.players.slice(1).forEach((p) => {
    assert.equal(p.released, true);
    assert.equal(p.releasedCount, 1);
  });
  // no strum fires after release, even if the timers were somehow forced
  assert.equal(env.players[0].played, 1);
  env.fireAll();
  env.players.slice(1).forEach((p) => assert.equal(p.played, 0));
});