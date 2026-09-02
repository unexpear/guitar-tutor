import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TuningPreset } from '../tuner/data/tunings';
import { MAX_CUSTOM_TUNINGS } from '../tuner/customTuning';

interface TuningState {
  customTunings: TuningPreset[];
  saveCustomTuning: (tuning: TuningPreset) => void;
  deleteCustomTuning: (id: string) => void;
  replaceCustomTunings: (tunings: TuningPreset[]) => void;
}

export const useTuningStore = create<TuningState>()(
  persist(
    (set) => ({
      customTunings: [],
      saveCustomTuning: (tuning) =>
        set((state) => ({
          customTunings: [
            ...state.customTunings.filter((item) => item.id !== tuning.id),
            tuning,
          ].slice(-MAX_CUSTOM_TUNINGS),
        })),
      deleteCustomTuning: (id) =>
        set((state) => ({ customTunings: state.customTunings.filter((item) => item.id !== id) })),
      replaceCustomTunings: (tunings) => set({ customTunings: tunings.slice(0, MAX_CUSTOM_TUNINGS) }),
    }),
    {
      name: 'standardtune-custom-tunings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ customTunings: state.customTunings }),
    },
  ),
);
