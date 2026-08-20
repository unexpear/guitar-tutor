import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GuitarType = 'acoustic' | 'electric' | 'classical' | 'bass';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type TuningPreference = 'standard' | 'drop_d' | 'open_g' | 'open_d' | 'dadgad';

export interface UserPreferences {
  guitarType: GuitarType;
  experienceLevel: ExperienceLevel;
  tuningPreference: TuningPreference;
  hasCompletedQuestionnaire: boolean;
  currentLessonIndex: number;
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
  setCurrentLessonIndex: (index: number) => void;
  nextLesson: () => void;
  previousLesson: () => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      guitarType: 'acoustic',
      experienceLevel: 'beginner',
      tuningPreference: 'standard',
      hasCompletedQuestionnaire: false,
      currentLessonIndex: 0,
      hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),
      setGuitarType: (type: GuitarType) => set({ guitarType: type }),
      setExperienceLevel: (level: ExperienceLevel) => set({ experienceLevel: level }),
      setTuningPreference: (tuning: TuningPreference) => set({ tuningPreference: tuning }),
      
      completeQuestionnaire: () => set({ hasCompletedQuestionnaire: true }),
      resetQuestionnaire: () => set({ hasCompletedQuestionnaire: false }),
      
      setCurrentLessonIndex: (index: number) => set({ currentLessonIndex: index }),
      nextLesson: () => set((state) => ({ currentLessonIndex: state.currentLessonIndex + 1 })),
      previousLesson: () => set((state) => ({ 
        currentLessonIndex: Math.max(0, state.currentLessonIndex - 1) 
      })),
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
        state?.setHasHydrated(true);
      },
    }
  )
);
