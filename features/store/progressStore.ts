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
import {
  XP_PER_LEVEL,
  levelFromXp,
  xpForFirstLesson,
  xpForGameScore,
} from '../progression/playerProgress';
import {
  DEFAULT_GUITAR_DESIGN_ID,
  GUITAR_DESIGNS,
  guitarDesign,
  isDesignUnlocked,
} from '../progression/guitarDesigns';
import {
  DEFAULT_GUITAR_MODEL_IDS,
  guitarModel,
  selectedModelId,
  type GuitarModelId,
  type GuitarType,
} from '../progression/guitarModels';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number;
}

interface ProgressData {
  completedLessons: Record<string, LessonProgress>;
  currentStreak: number;
  /** Lifetime total, retained even when old daily log entries are pruned. */
  lifetimePracticeSeconds: number;
  totalPracticeMinutes: number;
  favoriteChords: string[];
  alternateTuning: string;
  /** Best score per game id, e.g. { 'chord-quiz': 180 }. */
  gameHighScores: Record<string, number>;
  /** Local-only progression: no account, server, or competitive pressure. */
  totalXp: number;
  /** Completed rounds by game id, used for the player's own records. */
  gamePlays: Record<string, number>;
  selectedGuitarDesignId: string;
  selectedGuitarModelIds: Record<GuitarType, GuitarModelId>;
  /** Seconds practised per local calendar day, YYYY-MM-DD keyed. */
  practiceLog: Record<string, number>;
  /** Local day of the most recent session, or null if there has never been one. */
  lastPracticeDate: string | null;
  longestStreak: number;
  /** How each chord is going, keyed by chord name. */
  chordStats: ChordStats;
}

interface ProgressState extends ProgressData {

  completeLesson: (lessonId: string, score: number) => void;
  /** Records a completed round, awards XP, and returns true for a new best. */
  recordGameScore: (gameId: string, score: number) => boolean;
  /** Selects a collected design; locked or unknown ids are rejected. */
  selectGuitarDesign: (designId: string) => boolean;
  /** Selects a free physical model for its acoustic or electric family. */
  selectGuitarModel: (modelId: string) => boolean;
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
  /** Raises XP just enough to inspect every level-gated cosmetic. */
  unlockAllForTesting: () => void;
  /** Restores all learning, practice, score, and cosmetic progress defaults. */
  resetProgress: () => void;
}

const MAX_GUITAR_DESIGN_LEVEL = Math.max(
  ...GUITAR_DESIGNS.map((design) => design.unlockLevel),
);

export const TESTER_UNLOCK_XP = (MAX_GUITAR_DESIGN_LEVEL - 1) * XP_PER_LEVEL;

function initialProgressState(): ProgressData {
  return {
    completedLessons: {},
    currentStreak: 0,
    lifetimePracticeSeconds: 0,
    totalPracticeMinutes: 0,
    favoriteChords: [],
    alternateTuning: 'guitar-acoustic-standard',
    gameHighScores: {},
    totalXp: 0,
    gamePlays: {},
    selectedGuitarDesignId: DEFAULT_GUITAR_DESIGN_ID,
    selectedGuitarModelIds: { ...DEFAULT_GUITAR_MODEL_IDS },
    practiceLog: {},
    lastPracticeDate: null,
    longestStreak: 0,
    chordStats: {},
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialProgressState(),

      completeLesson: (lessonId: string, score: number) =>
        set((state) => {
          const firstCompletion = !state.completedLessons[lessonId]?.completed;
          return {
            completedLessons: {
              ...state.completedLessons,
              [lessonId]: {
                lessonId,
                completed: true,
                score: Math.max(state.completedLessons[lessonId]?.score ?? 0, score),
              },
            },
            totalXp: state.totalXp + (firstCompletion ? xpForFirstLesson(score) : 0),
          };
        }),

      recordGameScore: (gameId: string, score: number) => {
        const best = get().gameHighScores[gameId] ?? 0;
        set((state) => ({
          gameHighScores:
            score > best
              ? { ...state.gameHighScores, [gameId]: score }
              : state.gameHighScores,
          gamePlays: {
            ...state.gamePlays,
            [gameId]: (state.gamePlays[gameId] ?? 0) + 1,
          },
          totalXp: state.totalXp + xpForGameScore(score),
        }));
        return score > best;
      },

      selectGuitarDesign: (designId: string) => {
        const design = guitarDesign(designId);
        if (design.id !== designId || !isDesignUnlocked(design, levelFromXp(get().totalXp))) {
          return false;
        }
        set({ selectedGuitarDesignId: designId });
        return true;
      },

      selectGuitarModel: (modelId: string) => {
        const model = guitarModel(modelId);
        if (!model) return false;
        set((state) => ({
          selectedGuitarModelIds: {
            ...state.selectedGuitarModelIds,
            [model.guitarType]: model.id,
          },
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
          const lifetimePracticeSeconds = state.lifetimePracticeSeconds + seconds;
          return {
            practiceLog: log,
            // Out-of-order sessions (a clock that jumped) must not drag the
            // anchor backwards: liveStreak compares today against this, so a
            // regressed anchor would wrongly kill a live streak.
            lastPracticeDate:
              state.lastPracticeDate !== null && today < state.lastPracticeDate
                ? state.lastPracticeDate
                : today,
            currentStreak: streak,
            longestStreak: Math.max(state.longestStreak, streak),
            lifetimePracticeSeconds,
            totalPracticeMinutes: minutesFrom(lifetimePracticeSeconds),
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

      unlockAllForTesting: () =>
        set((state) => ({ totalXp: Math.max(state.totalXp, TESTER_UNLOCK_XP) })),

      resetProgress: () => set(initialProgressState()),
    }),
    {
      name: 'standardtune-progress',
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as Partial<ProgressState>;
        const lifetimePracticeSeconds =
          typeof state.lifetimePracticeSeconds === 'number'
            ? state.lifetimePracticeSeconds
            : Math.max(0, state.totalPracticeMinutes ?? 0) * 60;
        const gameHighScores = { ...(state.gameHighScores ?? {}) };
        for (const gameId of ['ear-training', 'fretboard-explorer']) {
          const oldScore = gameHighScores[gameId];
          if (typeof oldScore === 'number' && oldScore > 100) {
            gameHighScores[gameId] = Math.min(100, Math.round(oldScore / 10));
          }
        }
        return {
          ...state,
          gameHighScores,
          lifetimePracticeSeconds,
          totalPracticeMinutes: minutesFrom(lifetimePracticeSeconds),
          totalXp: typeof state.totalXp === 'number' ? Math.max(0, state.totalXp) : 0,
          gamePlays: state.gamePlays ?? {},
          selectedGuitarDesignId: state.selectedGuitarDesignId ?? DEFAULT_GUITAR_DESIGN_ID,
          selectedGuitarModelIds: {
            acoustic: selectedModelId(state.selectedGuitarModelIds, 'acoustic'),
            electric: selectedModelId(state.selectedGuitarModelIds, 'electric'),
          },
        } as ProgressState;
      },
    }
  )
);
