import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreLearningInstrument, type LearningInstrument } from '../lessons/data/learningInstrument';

/**
 * Kept for guitar anatomy and legacy tuning lookup. The separate
 * learningInstrument preference also supports the four-string bass path;
 * neither type implies a curriculum for every instrument in the tuner.
 */
export type GuitarType = 'acoustic' | 'electric' | 'classical';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type TuningPreference = 'standard' | 'drop_d' | 'open_g' | 'open_d' | 'dadgad';

export interface UserPreferences {
  guitarType: GuitarType;
  /** One curriculum at a time; independent of temporary tuner selections. */
  learningInstrument: LearningInstrument;
  experienceLevel: ExperienceLevel;
  tuningPreference: TuningPreference;
  hasCompletedQuestionnaire: boolean;
}

interface UserPreferencesState extends UserPreferences {
  /** True once the persisted state has been loaded from AsyncStorage. */
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setGuitarType: (type: GuitarType) => void;
  setLearningInstrument: (instrument: LearningInstrument) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setTuningPreference: (tuning: TuningPreference) => void;
  completeQuestionnaire: () => void;
  resetQuestionnaire: () => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      guitarType: 'acoustic',
      learningInstrument: 'acoustic',
      experienceLevel: 'beginner',
      tuningPreference: 'standard',
      hasCompletedQuestionnaire: false,
      hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),
      setGuitarType: (type: GuitarType) => set({ guitarType: type, learningInstrument: type }),
      setLearningInstrument: (instrument: LearningInstrument) => set({
        learningInstrument: instrument,
        ...(instrument === 'bass' ? {} : { guitarType: instrument }),
      }),
      setExperienceLevel: (level: ExperienceLevel) => set({ experienceLevel: level }),
      setTuningPreference: (tuning: TuningPreference) => set({ tuningPreference: tuning }),
      
      completeQuestionnaire: () => set({ hasCompletedQuestionnaire: true }),
      resetQuestionnaire: () =>
        set({
          guitarType: 'acoustic',
          learningInstrument: 'acoustic',
          experienceLevel: 'beginner',
          tuningPreference: 'standard',
          hasCompletedQuestionnaire: false,
        }),
      
    }),
    {
      name: 'standardtune-user-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<UserPreferences>;
        return { ...current, ...saved, learningInstrument: restoreLearningInstrument(saved.learningInstrument, saved.guitarType) };
      },
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
