import assert from 'node:assert/strict';
import test from 'node:test';
import { getChord } from '../features/chords/data/chords';
import { createJamBand } from '../features/jams/jamBand';
import {
  bassNoteForBeat,
  bassRegisterMidi,
  guitarNotesForChord,
  jamBeatEvent,
} from '../features/jams/jamPattern';
import { JAM_TRACKS, jamChordAt } from '../features/jams/jams';

test('every jam chord is a chord the app can play', () => {
  for (const jam of JAM_TRACKS) {
    assert.ok(jam.bars.length >= 4, jam.id);
    assert.ok(jam.bpm >= 40 && jam.bpm <= 200, jam.id);
    assert.equal(new Set(jam.scale).size, jam.scale.length, jam.id);
    for (const name of jam.bars) {
      assert.ok(getChord(name), `${jam.id} missing ${name}`);
    }
  }
});

test('jam bars loop', () => {
  const jam = JAM_TRACKS[0];
  assert.equal(jamChordAt(jam, 0), jam.bars[0]);
  assert.equal(jamChordAt(jam, jam.bars.length), jam.bars[0]);
  assert.equal(jamChordAt(jam, -1), jam.bars[jam.bars.length - 1]);
});

test('bass stays in a playable register', () => {
  assert.equal(bassRegisterMidi(67), 43); // G4 → G2
  assert.equal(bassRegisterMidi(28), 28); // E1 stays
  assert.equal(bassRegisterMidi(24), 36); // C1 → C2
});

test('G major jam beat 0 is kick, hat, root, and a full chord', () => {
  const jam = JAM_TRACKS.find((item) => item.id === 'g-major')!;
  const event = jamBeatEvent(jam, 0, 0);
  assert.equal(event.chordName, 'G');
  assert.deepEqual([...event.drums].sort(), ['hat', 'kick']);
  assert.equal(event.bassNote, bassNoteForBeat('G', 0));
  assert.ok(event.guitarNotes && event.guitarNotes.length >= 3);
  assert.deepEqual(event.guitarNotes, guitarNotesForChord('G'));
});

test('G major jam beat 2 is snare plus a chord restrike', () => {
  const jam = JAM_TRACKS.find((item) => item.id === 'g-major')!;
  const event = jamBeatEvent(jam, 0, 2);
  assert.deepEqual([...event.drums].sort(), ['hat', 'snare']);
  assert.ok(event.guitarNotes);
  assert.ok(event.bassNote);
});

test('off-beats keep the hat and bass without a guitar strum', () => {
  const jam = JAM_TRACKS.find((item) => item.id === 'c-major')!;
  const event = jamBeatEvent(jam, 1, 1);
  assert.deepEqual(event.drums, ['hat']);
  assert.equal(event.guitarNotes, null);
  assert.ok(event.bassNote);
});

test('every jam bar has a complete four-beat groove', () => {
  for (const jam of JAM_TRACKS) {
    for (let bar = 0; bar < jam.bars.length; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const event = jamBeatEvent(jam, bar, beat);
        assert.ok(getChord(event.chordName), `${jam.id} bar ${bar}`);
        assert.ok(event.drums.length > 0, `${jam.id} beat ${beat} drums`);
        assert.ok(event.bassNote, `${jam.id} beat ${beat} bass`);
        if (beat === 0 || beat === 2) {
          assert.ok(event.guitarNotes?.length, `${jam.id} beat ${beat} guitar`);
        }
      }
    }
  }
});

test('jam band plays drums, bass, and guitar without cancelling earlier hits', () => {
  const played: string[] = [];
  const band = createJamBand({
    createPlayer: (asset) => {
      const id = String(asset);
      return {
        volume: 1,
        setPlaybackRate() {},
        seekTo() {},
        play() {
          played.push(`play:${id}`);
        },
        release() {
          played.push(`release:${id}`);
        },
      };
    },
    getVolume: () => 80,
    soundsEnabled: () => true,
    kickAsset: 'kick',
    snareAsset: 'snare',
    hatAsset: 'hat',
    resolveNote: (note) => ({ asset: `note:${note}`, rate: 1 }),
    releaseAfterMs: 10_000,
    // Fire scheduled strum notes immediately so the test stays sync.
    timer: (fn) => {
      fn();
      return { cancel() {} };
    },
  });

  const jam = JAM_TRACKS[0];
  band.playBeat(jamBeatEvent(jam, 0, 0));
  const afterDownbeat = played.filter((item) => item.startsWith('play:')).length;
  assert.ok(afterDownbeat >= 4, `expected kick/hat/bass/guitar, got ${afterDownbeat}`);

  band.playBeat(jamBeatEvent(jam, 0, 2));
  const afterBackbeat = played.filter((item) => item.startsWith('play:')).length;
  assert.ok(afterBackbeat > afterDownbeat, 'snare beat must add more one-shots');
  // Releases happen only after the release timer; immediate timer above also
  // ran those, so stop() must still be safe either way.
  band.stop();
  assert.ok(afterBackbeat > afterDownbeat);
});
