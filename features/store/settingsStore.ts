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

  setSoundsEnabled: (enabled: boolean) => void;
  setSampleVolume: (volume: number) => void;
  setPracticeGoalMinutes: (minutes: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundsEnabled: true,
      sampleVolume: 75,
      practiceGoalMinutes: 15,

      setSoundsEnabled: (enabled: boolean) => set({ soundsEnabled: enabled }),
      setSampleVolume: (volume: number) =>
        set({ sampleVolume: Math.max(0, Math.min(100, Math.round(volume))) }),
      setPracticeGoalMinutes: (minutes: number) =>
        set({ practiceGoalMinutes: Math.max(5, Math.min(120, minutes)) }),
    }),
    {
      name: 'standardtune-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
