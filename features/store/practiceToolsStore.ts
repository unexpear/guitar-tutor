import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PracticeToolsState {
  progressions: string[][];
  saveProgression: (chords: string[]) => void;
  deleteProgression: (index: number) => void;
}

export const usePracticeToolsStore = create<PracticeToolsState>()(
  persist(
    (set) => ({
      progressions: [],
      saveProgression: (chords) => set((state) => {
        if (chords.length < 2) return state;
        const key = chords.join('|');
        if (state.progressions.some((item) => item.join('|') === key)) return state;
        return { progressions: [[...chords], ...state.progressions] };
      }),
      deleteProgression: (index) => set((state) => ({ progressions: state.progressions.filter((_, itemIndex) => itemIndex !== index) })),
    }),
    { name: 'standardtune-practice-tools', storage: createJSONStorage(() => AsyncStorage), partialize: (state) => ({ progressions: state.progressions }) },
  ),
);
