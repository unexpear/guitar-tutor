import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number;
}

export interface ChordFavorite {
  chordName: string;
  addedAt: number;
}

interface ProgressState {
  completedLessons: Record<string, LessonProgress>;
  currentStreak: number;
  totalPracticeMinutes: number;
  favoriteChords: string[];
  alternateTuning: string;
  /** Best score per game id, e.g. { 'chord-quiz': 180 }. */
  gameHighScores: Record<string, number>;

  completeLesson: (lessonId: string, score: number) => void;
  /** Records a score if it beats the stored best. Returns true if it did. */
  recordGameScore: (gameId: string, score: number) => boolean;
  getGameHighScore: (gameId: string) => number;
  addFavoriteChord: (chordName: string) => void;
  removeFavoriteChord: (chordName: string) => void;
  setAlternateTuning: (tuning: string) => void;
  addPracticeTime: (minutes: number) => void;
  getLessonScore: (lessonId: string) => number;
  isLessonCompleted: (lessonId: string) => boolean;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: {},
      currentStreak: 0,
      totalPracticeMinutes: 0,
      favoriteChords: [],
      alternateTuning: 'Standard E',
      gameHighScores: {},

      completeLesson: (lessonId: string, score: number) =>
        set((state) => ({
          completedLessons: {
            ...state.completedLessons,
            [lessonId]: {
              lessonId,
              completed: true,
              score: Math.max(state.completedLessons[lessonId]?.score ?? 0, score),
            },
          },
        })),

      recordGameScore: (gameId: string, score: number) => {
        const best = get().gameHighScores[gameId] ?? 0;
        if (score <= best) return false;
        set((state) => ({
          gameHighScores: { ...state.gameHighScores, [gameId]: score },
        }));
        return true;
      },

      getGameHighScore: (gameId: string) => get().gameHighScores[gameId] ?? 0,

      addFavoriteChord: (chordName: string) =>
        set((state) => ({
          favoriteChords: [...state.favoriteChords, chordName],
        })),

      removeFavoriteChord: (chordName: string) =>
        set((state) => ({
          favoriteChords: state.favoriteChords.filter((c) => c !== chordName),
        })),

      setAlternateTuning: (tuning: string) =>
        set({ alternateTuning: tuning }),

      addPracticeTime: (minutes: number) =>
        set((state) => ({
          totalPracticeMinutes: state.totalPracticeMinutes + minutes,
        })),

      getLessonScore: (lessonId: string) =>
        get().completedLessons[lessonId]?.score ?? 0,

      isLessonCompleted: (lessonId: string) =>
        get().completedLessons[lessonId]?.completed ?? false,
    }),
    {
      name: 'standardtune-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
