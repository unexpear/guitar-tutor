import type { JamBeatEvent } from './jamPattern';

export interface JamBandPlayer {
  volume: number;
  setPlaybackRate?(rate: number): void;
  shouldCorrectPitch?: boolean;
  seekTo?(seconds: number): void;
  play(): void;
  pause?(): void;
  release(): void;
}

export interface JamNoteSample {
  asset: number | string;
  rate: number;
}

export interface JamBandDeps {
  createPlayer: (asset: number | string) => JamBandPlayer;
  getVolume: () => number;
  soundsEnabled: () => boolean;
  kickAsset: number | string;
  snareAsset: number | string;
  hatAsset: number | string;
  /** Resolve a pitched note for bass/guitar. Injected so tests stay asset-free. */
  resolveNote: (note: string) => JamNoteSample | null;
  /** Optional release delay so one-shots can finish ringing. */
  releaseAfterMs?: number;
  timer?: (fn: () => void, ms: number) => { cancel(): void };
}

/**
 * Overlapping one-shot band: drums, bass, and guitar can all sound together.
 * Unlike createSoundController.playChord, a new hit does not stop the others.
 */
export function createJamBand(deps: JamBandDeps) {
  const releaseAfterMs = deps.releaseAfterMs ?? 2200;
  const timer =
    deps.timer ??
    ((fn, ms) => {
      const handle = setTimeout(fn, ms);
      return { cancel: () => clearTimeout(handle) };
    });
  const live: { player: JamBandPlayer; cancel: () => void }[] = [];
  const pending: { cancel: () => void }[] = [];

  const playAsset = (asset: number | string, rate = 1, volumeScale = 1) => {
    if (!deps.soundsEnabled()) return;
    const volume = Math.max(0, Math.min(1, (deps.getVolume() / 100) * volumeScale));
    if (volume <= 0) return;
    try {
      const player = deps.createPlayer(asset);
      player.volume = volume;
      if (player.shouldCorrectPitch !== undefined) player.shouldCorrectPitch = false;
      if (player.setPlaybackRate) player.setPlaybackRate(rate);
      try {
        player.seekTo?.(0);
      } catch {
        /* some players start at 0 */
      }
      player.play();
      const handle = timer(() => {
        try {
          player.release();
        } catch {
          /* already released */
        }
        const index = live.findIndex((item) => item.player === player);
        if (index >= 0) live.splice(index, 1);
      }, releaseAfterMs);
      live.push({ player, cancel: handle.cancel });
    } catch {
      /* device may refuse a player */
    }
  };

  const playDrum = (name: 'kick' | 'snare' | 'hat') => {
    const asset =
      name === 'kick' ? deps.kickAsset : name === 'snare' ? deps.snareAsset : deps.hatAsset;
    const scale = name === 'hat' ? 0.55 : name === 'snare' ? 0.85 : 1;
    playAsset(asset, 1, scale);
  };

  const playBass = (note: string) => {
    const mapped = deps.resolveNote(note);
    if (!mapped) return;
    playAsset(mapped.asset, mapped.rate, 0.9);
  };

  const playGuitar = (notes: readonly string[]) => {
    notes.forEach((note, index) => {
      const mapped = deps.resolveNote(note);
      if (!mapped) return;
      const fire = () => playAsset(mapped.asset, mapped.rate, 0.7);
      if (index === 0) {
        fire();
        return;
      }
      const handle = timer(fire, index * 28);
      pending.push(handle);
    });
  };

  return {
    playBeat(event: JamBeatEvent) {
      for (const drum of event.drums) playDrum(drum);
      if (event.bassNote) playBass(event.bassNote);
      if (event.guitarNotes && event.guitarNotes.length > 0) playGuitar(event.guitarNotes);
    },
    stop() {
      for (const item of pending.splice(0)) item.cancel();
      for (const item of live.splice(0)) {
        item.cancel();
        try {
          item.player.pause?.();
        } catch {
          /* ignore */
        }
        try {
          item.player.release();
        } catch {
          /* ignore */
        }
      }
    },
  };
}

export type JamBand = ReturnType<typeof createJamBand>;
