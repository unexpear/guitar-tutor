import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  /** Master switch for reference-note / metronome sounds. */
  soundsEnabled: boolean;
  /** Playback volume for guitar samples and metronome clicks, 0-100. */
  sampleVolume: number;
  /** Daily practice goal in minutes. */
  practiceGoalMinutes: number;
  /** Concert pitch used by both native detection and target-note maths. */
  referencePitchHz: number;
  /** How close a displayed reading must be before it is marked in tune. */
  inTuneToleranceCents: number;
  /** Input profile: quiet catches soft instruments; noisy rejects more room sound. */
  tunerSensitivity: 'quiet' | 'normal' | 'noisy';
  meterStyle: 'needle' | 'strobe';
  leftHanded: boolean;
  hapticsEnabled: boolean;
  spokenFeedbackEnabled: boolean;
  autoAdvanceStrings: boolean;

  setSoundsEnabled: (enabled: boolean) => void;
  setSampleVolume: (volume: number) => void;
  setPracticeGoalMinutes: (minutes: number) => void;
  setReferencePitchHz: (hz: number) => void;
  setInTuneToleranceCents: (cents: number) => void;
  setTunerSensitivity: (value: 'quiet' | 'normal' | 'noisy') => void;
  setMeterStyle: (value: 'needle' | 'strobe') => void;
  setLeftHanded: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setSpokenFeedbackEnabled: (enabled: boolean) => void;
  setAutoAdvanceStrings: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundsEnabled: true,
      sampleVolume: 75,
      practiceGoalMinutes: 15,
      referencePitchHz: 440,
      inTuneToleranceCents: 3,
      tunerSensitivity: 'normal',
      meterStyle: 'needle',
      leftHanded: false,
      hapticsEnabled: false,
      spokenFeedbackEnabled: false,
      autoAdvanceStrings: false,

      setSoundsEnabled: (enabled: boolean) => set({ soundsEnabled: enabled }),
      setSampleVolume: (volume: number) =>
        set({ sampleVolume: Math.max(0, Math.min(100, Math.round(volume))) }),
      setPracticeGoalMinutes: (minutes: number) =>
        set({ practiceGoalMinutes: Math.max(5, Math.min(120, minutes)) }),
      setReferencePitchHz: (hz: number) =>
        set({ referencePitchHz: Math.max(430, Math.min(450, Math.round(hz))) }),
      setInTuneToleranceCents: (cents: number) =>
        set({
          inTuneToleranceCents: Math.max(1, Math.min(5, Math.round(cents))),
        }),
      setTunerSensitivity: (tunerSensitivity) => set({ tunerSensitivity }),
      setMeterStyle: (meterStyle) => set({ meterStyle }),
      setLeftHanded: (leftHanded) => set({ leftHanded }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setSpokenFeedbackEnabled: (spokenFeedbackEnabled) => set({ spokenFeedbackEnabled }),
      setAutoAdvanceStrings: (autoAdvanceStrings) => set({ autoAdvanceStrings }),
    }),
    {
      name: 'standardtune-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
