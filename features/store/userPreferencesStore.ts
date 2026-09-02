import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * This preference describes the six-string guitar learning curriculum, not
 * every instrument supported by the tuner. Bass, ukulele, and extended-range
 * instruments are selected independently on the Tuner screen; listing them
 * here would imply that lessons and chord diagrams adapt to those instruments.
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
        // Migrate old questionnaire values that the guitar curriculum cannot
        // represent. The tuner keeps its own independent instrument choice.
        if (state && !['acoustic', 'electric', 'classical'].includes(state.guitarType)) {
          state.guitarType = 'electric';
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
