import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { createSoundController, type SoundController } from '../soundController';
import { sampleForNote, referenceSample } from '../data/audioAssets';
import { recordedChordSample } from '../data/chordAudioAssets';

let lastAudioNotice = 0;
function reportAudioIssue(issue: 'muted' | 'missing' | 'failed') {
  // A strum or guide can fail for several notes at once; avoid stacked dialogs.
  if (Date.now() - lastAudioNotice < 4000) return;
  lastAudioNotice = Date.now();
  Alert.alert(issue === 'muted' ? 'Reference audio is muted' : 'Could not play audio',
    issue === 'muted' ? 'Enable sounds and raise Sample volume in Settings. Also check your phone’s media volume.'
      : issue === 'missing' ? 'This note has no supported reference sample. Please report the note and tuning in Feedback.'
      : 'Try playback again. Check media volume and Bluetooth output; if it keeps failing, report the screen and action in Feedback.');
}

/**
 * Play instrument reference notes and guitar chord samples.
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
      resolveReferenceSample: referenceSample,
      resolveChordSample: recordedChordSample,
      getSettings: () => useSettingsStore.getState(),
      setAudioMode: setAudioModeAsync,
      onIssue: reportAudioIssue,
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
      stopAll: controller.releaseAll.bind(controller),
    }),
    [controller]
  );
}
