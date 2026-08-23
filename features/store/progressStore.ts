import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  toDateKey,
  nextStreak,
  streakAsOf,
  pruneLog,
  minutesFrom,
} from '../practice/streak';
import { ChordStats, recordAttempt } from '../practice/chordStats';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number;
}

interface ProgressState {
  completedLessons: Record<string, LessonProgress>;
  currentStreak: number;
  totalPracticeMinutes: number;
  favoriteChords: string[];
  alternateTuning: string;
  /** Best score per game id, e.g. { 'chord-quiz': 180 }. */
  gameHighScores: Record<string, number>;
  /** Seconds practised per local calendar day, YYYY-MM-DD keyed. */
  practiceLog: Record<string, number>;
  /** Local day of the most recent session, or null if there has never been one. */
  lastPracticeDate: string | null;
  longestStreak: number;
  /** How each chord is going, keyed by chord name. */
  chordStats: ChordStats;

  completeLesson: (lessonId: string, score: number) => void;
  /** Records a score if it beats the stored best. Returns true if it did. */
  recordGameScore: (gameId: string, score: number) => boolean;
  addFavoriteChord: (chordName: string) => void;
  removeFavoriteChord: (chordName: string) => void;
  setAlternateTuning: (tuning: string) => void;
  /** Log time at the instrument. The only thing that moves the streak. */
  recordPractice: (seconds: number, now?: Date) => void;
  /**
   * Record a judged attempt at a chord — a quiz answer, a drill target, a
   * change that did or did not land. Only call this where something was
   * actually assessed.
   */
  recordChordAttempt: (chordName: string, correct: boolean, now?: Date) => void;
  /** Seconds practised today. */
  practiceSecondsToday: (now?: Date) => number;
  /** The streak, but zero if it has already lapsed. */
  liveStreak: (now?: Date) => number;
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
      practiceLog: {},
      lastPracticeDate: null,
      longestStreak: 0,
      chordStats: {},

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

      recordPractice: (seconds: number, now: Date = new Date()) => {
        if (!Number.isFinite(seconds) || seconds <= 0) return;
        const today = toDateKey(now);
        set((state) => {
          const log = pruneLog(
            { ...state.practiceLog, [today]: (state.practiceLog[today] ?? 0) + seconds },
            today
          );
          const streak = nextStreak(state.lastPracticeDate, state.currentStreak, today);
          const totalSeconds = Object.values(log).reduce((a, b) => a + b, 0);
          return {
            practiceLog: log,
            lastPracticeDate: today,
            currentStreak: streak,
            longestStreak: Math.max(state.longestStreak, streak),
            totalPracticeMinutes: minutesFrom(totalSeconds),
          };
        });
      },

      recordChordAttempt: (chordName: string, correct: boolean, now: Date = new Date()) =>
        set((state) => ({
          chordStats: recordAttempt(state.chordStats, chordName, correct, now),
        })),

      practiceSecondsToday: (now: Date = new Date()) =>
        get().practiceLog[toDateKey(now)] ?? 0,

      liveStreak: (now: Date = new Date()) =>
        streakAsOf(get().lastPracticeDate, get().currentStreak, toDateKey(now)),

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
