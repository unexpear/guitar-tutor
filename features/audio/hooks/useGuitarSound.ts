import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useMemo } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { createSoundController, type SoundController } from '../soundController';
import { sampleForNote } from '../data/audioAssets';

/**
 * Play guitar reference samples: single notes and strummed chords.
 *
 * All of the decision logic lives in createSoundController; this hook only
 * wires it to the real engine (expo-audio's createAudioPlayer), the bundled
 * WAV assets, and the settings store. It exists once per component, keeping
 * the four public methods referentially stable across renders.
 */
export function useGuitarSound() {
  const controllerRef = useRef<SoundController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createSoundController({
      createPlayer: (asset) => createAudioPlayer(asset),
      resolveSample: sampleForNote,
      getSettings: () => useSettingsStore.getState(),
      setAudioMode: setAudioModeAsync,
    });
  }
  const controller = controllerRef.current;

  useEffect(() => {
    void controller.configureMode();
    return () => controller.releaseAll();
  }, [controller]);

  return useMemo(
    () => ({
      playNote: controller.playNote.bind(controller),
      playChord: controller.playChord.bind(controller),
      stopChord: controller.stopChord.bind(controller),
    }),
    [controller]
  );
}