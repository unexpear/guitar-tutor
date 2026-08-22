import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bass is deliberately absent. Everything in the app assumes six strings in
 * guitar range — the chord library, the diagrams, the tuner's string row —
 * and a bass is four strings an octave below, so offering it produced
 * confidently wrong tuning targets. Classical stays: it is standard tuning
 * on nylon strings, which the acoustic material genuinely covers.
 */
export type GuitarType = 'acoustic' | 'electric' | 'classical';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type TuningPreference = 'standard' | 'drop_d' | 'open_g' | 'open_d' | 'dadgad';

export interface UserPreferences {
  guitarType: GuitarType;
  experienceLevel: ExperienceLevel;
  tuningPreference: TuningPreference;
  hasCompletedQuestionnaire: boolean;
}

interface UserPreferencesState extends UserPreferences {
  /** True once the persisted state has been loaded from AsyncStorage. */
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setGuitarType: (type: GuitarType) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setTuningPreference: (tuning: TuningPreference) => void;
  completeQuestionnaire: () => void;
  resetQuestionnaire: () => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      guitarType: 'acoustic',
      experienceLevel: 'beginner',
      tuningPreference: 'standard',
      hasCompletedQuestionnaire: false,
      hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),
      setGuitarType: (type: GuitarType) => set({ guitarType: type }),
      setExperienceLevel: (level: ExperienceLevel) => set({ experienceLevel: level }),
      setTuningPreference: (tuning: TuningPreference) => set({ tuningPreference: tuning }),
      
      completeQuestionnaire: () => set({ hasCompletedQuestionnaire: true }),
      resetQuestionnaire: () => set({ hasCompletedQuestionnaire: false }),
      
    }),
    {
      name: 'standardtune-user-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        // Don't persist the transient hydration flag.
        const { hasHydrated, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        // Anyone who picked Bass before it was withdrawn is moved to the
        // closest thing the app actually supports.
        if (state && !['acoustic', 'electric', 'classical'].includes(state.guitarType)) {
          state.guitarType = 'electric';
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
