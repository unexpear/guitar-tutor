export const XP_PER_LEVEL = 100;

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percent: number;
}

export function levelFromXp(totalXp: number): number {
  const safeXp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  return Math.floor(safeXp / XP_PER_LEVEL) + 1;
}

export function levelProgress(totalXp: number): LevelProgress {
  const safeXp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  return {
    level: levelFromXp(safeXp),
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    percent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
  };
}

/** Every completed round pays something; accuracy raises the reward. */
export function xpForGameScore(score: number): number {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  return 20 + Math.round(safeScore / 2);
}

export function xpForFirstLesson(score: number): number {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  return 50 + Math.round(safeScore / 4);
}
