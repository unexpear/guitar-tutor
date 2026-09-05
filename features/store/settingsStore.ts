import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SettingsMode = 'beginner' | 'advanced';

interface SettingsValues {
  settingsMode: SettingsMode;
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
  /** Deviation where the display changes from close/yellow to red. */
  closeToleranceCents: number;
  /** Input profile: quiet catches soft instruments; noisy rejects more room sound. */
  tunerSensitivity: 'quiet' | 'normal' | 'noisy';
  meterStyle: 'needle' | 'strobe';
  leftHanded: boolean;
  hapticsEnabled: boolean;
  spokenFeedbackEnabled: boolean;
  autoAdvanceStrings: boolean;
}

interface SettingsState extends SettingsValues {
  setSettingsMode: (mode: SettingsMode) => void;
  resetToBeginnerDefaults: () => void;

  setSoundsEnabled: (enabled: boolean) => void;
  setSampleVolume: (volume: number) => void;
  setPracticeGoalMinutes: (minutes: number) => void;
  setReferencePitchHz: (hz: number) => void;
  setInTuneToleranceCents: (cents: number) => void;
  setCloseToleranceCents: (cents: number) => void;
  setTunerSensitivity: (value: 'quiet' | 'normal' | 'noisy') => void;
  setMeterStyle: (value: 'needle' | 'strobe') => void;
  setLeftHanded: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setSpokenFeedbackEnabled: (enabled: boolean) => void;
  setAutoAdvanceStrings: (enabled: boolean) => void;
}

const BEGINNER_DEFAULTS: SettingsValues = {
  settingsMode: 'beginner',
  soundsEnabled: true,
  sampleVolume: 75,
  practiceGoalMinutes: 15,
  referencePitchHz: 440,
  inTuneToleranceCents: 1,
  closeToleranceCents: 10,
  tunerSensitivity: 'normal',
  meterStyle: 'needle',
  leftHanded: false,
  hapticsEnabled: true,
  spokenFeedbackEnabled: false,
  autoAdvanceStrings: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...BEGINNER_DEFAULTS,

      setSettingsMode: (settingsMode) => set((state) =>
        settingsMode === 'beginner'
          ? { ...BEGINNER_DEFAULTS }
          : state.settingsMode === 'advanced'
            ? { settingsMode }
            : { settingsMode, inTuneToleranceCents: 0.5 },
      ),
      resetToBeginnerDefaults: () => set({ ...BEGINNER_DEFAULTS }),

      setSoundsEnabled: (enabled: boolean) => set({ soundsEnabled: enabled }),
      setSampleVolume: (volume: number) =>
        set({ sampleVolume: Math.max(0, Math.min(100, Math.round(volume))) }),
      setPracticeGoalMinutes: (minutes: number) =>
        set({ practiceGoalMinutes: Math.max(5, Math.min(120, minutes)) }),
      setReferencePitchHz: (hz: number) =>
        set({ referencePitchHz: Math.max(430, Math.min(450, Math.round(hz))) }),
      setInTuneToleranceCents: (cents: number) =>
        set({
          inTuneToleranceCents: Math.max(
            0.5,
            Math.min(5, Math.round(cents * 10) / 10),
          ),
        }),
      setCloseToleranceCents: (cents: number) =>
        set({
          closeToleranceCents: Math.max(
            6,
            Math.min(50, Math.round(cents * 10) / 10),
          ),
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
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<SettingsState>;
        // Existing users keep every choice they already made. They start in
        // Advanced because older versions exposed all controls directly.
        return {
          ...state,
          settingsMode:
            version < 1
              ? 'advanced'
              : state.settingsMode === 'advanced'
                ? 'advanced'
                : 'beginner',
          closeToleranceCents:
            version < 2 || !Number.isFinite(state.closeToleranceCents)
              ? BEGINNER_DEFAULTS.closeToleranceCents
              : Math.max(6, Math.min(50, state.closeToleranceCents!)),
        } as SettingsState;
      },
    }
  )
);
