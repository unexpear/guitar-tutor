import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

const audioAssets: Record<string, any> = {
  'C2': require('../../../assets/audio/C2.wav'),
  'C#2': require('../../../assets/audio/C#2.wav'),
  'D2': require('../../../assets/audio/D2.wav'),
  'D#2': require('../../../assets/audio/D#2.wav'),
  'A2': require('../../../assets/audio/A2.wav'),
  'A#2': require('../../../assets/audio/A#2.wav'),
  'B2': require('../../../assets/audio/B2.wav'),
  'C3': require('../../../assets/audio/C3.wav'),
  'C#3': require('../../../assets/audio/C#3.wav'),
  'D3': require('../../../assets/audio/D3.wav'),
  'D#3': require('../../../assets/audio/D#3.wav'),
  'E2': require('../../../assets/audio/E2.wav'),
  'E3': require('../../../assets/audio/E3.wav'),
  'F2': require('../../../assets/audio/F2.wav'),
  'F#2': require('../../../assets/audio/F#2.wav'),
  'G2': require('../../../assets/audio/G2.wav'),
  'G#2': require('../../../assets/audio/G#2.wav'),
  'A3': require('../../../assets/audio/A3.wav'),
  'A#3': require('../../../assets/audio/A#3.wav'),
  'B3': require('../../../assets/audio/B3.wav'),
  'C4': require('../../../assets/audio/C4.wav'),
  'C#4': require('../../../assets/audio/C#4.wav'),
  'D4': require('../../../assets/audio/D4.wav'),
  'D#4': require('../../../assets/audio/D#4.wav'),
  'E4': require('../../../assets/audio/E4.wav'),
  'F3': require('../../../assets/audio/F3.wav'),
  'F#3': require('../../../assets/audio/F#3.wav'),
  'G3': require('../../../assets/audio/G3.wav'),
  'G#3': require('../../../assets/audio/G#3.wav'),
  'A4': require('../../../assets/audio/A4.wav'),
  'A#4': require('../../../assets/audio/A#4.wav'),
  'B4': require('../../../assets/audio/B4.wav'),
  'C5': require('../../../assets/audio/C5.wav'),
  'C#5': require('../../../assets/audio/C#5.wav'),
  'D5': require('../../../assets/audio/D5.wav'),
  'D#5': require('../../../assets/audio/D#5.wav'),
  'E5': require('../../../assets/audio/E5.wav'),
  'F4': require('../../../assets/audio/F4.wav'),
  'F#4': require('../../../assets/audio/F#4.wav'),
  'G4': require('../../../assets/audio/G4.wav'),
  'G#4': require('../../../assets/audio/G#4.wav'),
  'A5': require('../../../assets/audio/A5.wav'),
  'A#5': require('../../../assets/audio/A#5.wav'),
  'B5': require('../../../assets/audio/B5.wav'),
  'C6': require('../../../assets/audio/C6.wav'),
  'C#6': require('../../../assets/audio/C#6.wav'),
  'D6': require('../../../assets/audio/D6.wav'),
  'D#6': require('../../../assets/audio/D#6.wav'),
  'E6': require('../../../assets/audio/E6.wav'),
  'F5': require('../../../assets/audio/F5.wav'),
  'F#5': require('../../../assets/audio/F#5.wav'),
  'G5': require('../../../assets/audio/G5.wav'),
  'G#5': require('../../../assets/audio/G#5.wav'),
};

type Player = ReturnType<typeof createAudioPlayer>;

export function useGuitarSound() {
  const playerRef = useRef<Player | null>(null);
  // A strum needs several samples ringing at once, so chord playback keeps
  // its own set of players rather than sharing the single-note one.
  const chordPlayersRef = useRef<Player[]>([]);
  const chordTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopChord = useCallback(() => {
    chordTimersRef.current.forEach(clearTimeout);
    chordTimersRef.current = [];
    chordPlayersRef.current.forEach((p) => {
      try {
        p.release();
      } catch {
        // already released
      }
    });
    chordPlayersRef.current = [];
  }, []);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: false,
    }).catch(() => {});

    return () => {
      playerRef.current?.release();
      stopChord();
    };
  }, [stopChord]);

  const playNote = useCallback(async (note: string) => {
    try {
      const { soundsEnabled, sampleVolume } = useSettingsStore.getState();
      if (!soundsEnabled) return;

      playerRef.current?.release();

      const asset = audioAssets[note];
      if (!asset) {
        console.warn('No audio sample for note:', note);
        return;
      }

      const player = createAudioPlayer(asset);
      playerRef.current = player;
      player.volume = sampleVolume / 100;
      player.play();
    } catch (err) {
      console.warn('Failed to play note:', note, err);
    }
  }, []);

  /**
   * Play the notes of a chord as a strum: one sample per sounding string,
   * staggered so it sounds like a pick crossing the strings rather than a
   * piano-style block chord.
   */
  const playChord = useCallback(
    async (notes: string[], staggerMs = 55) => {
      try {
        const { soundsEnabled, sampleVolume } = useSettingsStore.getState();
        if (!soundsEnabled) return;

        stopChord();

        const players = notes
          .map((note) => {
            const asset = audioAssets[note];
            if (!asset) {
              console.warn('No audio sample for note:', note);
              return null;
            }
            const player = createAudioPlayer(asset);
            player.volume = sampleVolume / 100;
            return player;
          })
          .filter((p): p is Player => p !== null);

        chordPlayersRef.current = players;

        players.forEach((player, i) => {
          const timer = setTimeout(() => {
            // The strum can be cancelled mid-flight by a new one or by
            // unmounting, which releases these players.
            if (!chordPlayersRef.current.includes(player)) return;
            try {
              player.play();
            } catch {
              // released between scheduling and firing
            }
          }, i * staggerMs);
          chordTimersRef.current.push(timer);
        });
      } catch (err) {
        console.warn('Failed to play chord:', err);
      }
    },
    [stopChord]
  );

  return { playNote, playChord, stopChord };
}
