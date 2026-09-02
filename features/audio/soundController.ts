/**
 * The audio decision logic behind useGuitarSound, as a pure, injectable
 * controller. React Native / expo-audio / the bundled WAVs are injected at
 * the edge, so every rule below is exercised deterministically in tests:
 *
 *  - a silenced setting produces no players at all
 *  - a missing sample warns and produces no player
 *  - a new single note releases the previous one exactly once
 *  - a chord is one player per sounding string, staggered, with every
 *    superseded strum cancelled at unmount time
 *  - the audio mode is configured once; releaseAll is idempotent
 */

export interface SoundPlayer {
  volume: number;
  playbackRate: number;
  shouldCorrectPitch: boolean;
  play(): void;
  release(): void;
}

export interface ChordPlayback {
  notes: string;
  staggerMs: number;
}

export interface SoundSettings {
  soundsEnabled: boolean;
  sampleVolume: number;
  referencePitchHz: number;
}

/** A cancellable scheduling handle; the default adapts setTimeout. */
export interface TimerHandle {
  cancel(): void;
}

export interface SoundControllerDeps {
  createPlayer: (asset: number | string) => SoundPlayer;
  resolveSample: (note: string) => number | string | null;
  getSettings: () => SoundSettings;
  setAudioMode: (
    mode: {
      playsInSilentMode: boolean;
      interruptionMode: 'doNotMix' | 'mixWithOthers' | 'duckOthers';
      allowsRecording: boolean;
      shouldPlayInBackground: boolean;
    }
  ) => Promise<void>;
  warn?: (message: string) => void;
  timer?: (fn: () => void, ms: number) => TimerHandle;
  clearTimer?: (handle: TimerHandle) => void;
}

export interface SoundController {
  configureMode(): Promise<void>;
  playNote(note: string): Promise<void>;
  playChord(notes: string[], staggerMs?: number): Promise<void>;
  stopChord(): void;
  releaseAll(): void;
}

export function createSoundController(
  deps: SoundControllerDeps
): SoundController {
  const {
    createPlayer,
    resolveSample,
    getSettings,
    setAudioMode,
    warn = (message) => console.warn(message),
    timer = (fn, ms) => {
      const handle = setTimeout(fn, ms);
      return { cancel: () => clearTimeout(handle) };
    },
    clearTimer = (handle) => handle.cancel(),
  } = deps;

  let single: SoundPlayer | null = null;
  let chordPlayers: SoundPlayer[] = [];
  let chordTimers: TimerHandle[] = [];

  const configurePlayer = (
    player: SoundPlayer,
    settings: SoundSettings,
  ) => {
    player.volume = settings.sampleVolume / 100;
    const reference =
      Number.isFinite(settings.referencePitchHz) && settings.referencePitchHz > 0
        ? settings.referencePitchHz
        : 440;
    // Samples were generated at A4=440. Disabling time-stretch pitch
    // correction makes this small rate change retune the sample itself.
    player.shouldCorrectPitch = false;
    player.playbackRate = reference / 440;
  };

  const stopChord: SoundController['stopChord'] = () => {
    chordTimers.forEach((handle) => void clearTimer(handle));
    chordTimers = [];
    chordPlayers.forEach((player) => {
      try {
        player.release();
      } catch {
        // already released
      }
    });
    chordPlayers = [];
  };

  return {
    async configureMode() {
      try {
        await setAudioMode({
          playsInSilentMode: true,
          interruptionMode: 'doNotMix',
          allowsRecording: false,
          shouldPlayInBackground: false,
        });
      } catch {
        // the device may refuse an audio session; playing sound simply won't
        // exist for that session, which is fine
      }
    },

    async playNote(note: string) {
      try {
        const settings = getSettings();
        const { soundsEnabled } = settings;
        if (!soundsEnabled) return;

        single?.release();
        single = null;

        const asset = resolveSample(note);
        if (asset === null) {
          warn(`No audio sample for note: ${note}`);
          return;
        }

        const player = createPlayer(asset);
        single = player;
        configurePlayer(player, settings);
        player.play();
      } catch (err) {
        warn(`Failed to play note: ${note}`);
      }
    },

    async playChord(notes: string[], staggerMs = 55) {
      try {
        const settings = getSettings();
        const { soundsEnabled } = settings;
        if (!soundsEnabled) return;

        stopChord();

        const players = notes
          .map((note) => {
            const asset = resolveSample(note);
            if (asset === null) {
              warn(`No audio sample for note: ${note}`);
              return null;
            }
            const player = createPlayer(asset);
            configurePlayer(player, settings);
            return player;
          })
          .filter((p): p is SoundPlayer => p !== null);

        chordPlayers = players;

        players.forEach((player, i) => {
          const handle = timer(() => {
            // The strum can be cancelled mid-flight by a new one or by
            // unmounting, which releases these players.
            if (!chordPlayers.includes(player)) return;
            try {
              player.play();
            } catch {
              // released between scheduling and firing
            }
          }, i * staggerMs);
          chordTimers.push(handle);
        });
      } catch (err) {
        warn(`Failed to play chord: ${notes.join('-')}`);
      }
    },

    stopChord,

    releaseAll() {
      try {
        single?.release();
      } catch {
        // already released
      }
      single = null;
      stopChord();
    },
  };
}
