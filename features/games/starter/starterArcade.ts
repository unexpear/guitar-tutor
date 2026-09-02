export type StarterGameId = 'string-scout' | 'tune-sense';
export type StarterDifficulty = 'guided' | 'challenge';

export const STARTER_ROUND_LENGTH: Record<StarterDifficulty, number> = {
  guided: 6,
  challenge: 10,
};

export const STRING_NAMES = [
  'Low E · string 6',
  'A · string 5',
  'D · string 4',
  'G · string 3',
  'B · string 2',
  'High e · string 1',
] as const;

export type TuneChoice = 'Tune up' | 'In tune' | 'Tune down';

export function tuneChoiceForCents(cents: number, tolerance = 3): TuneChoice {
  if (cents < -tolerance) return 'Tune up';
  if (cents > tolerance) return 'Tune down';
  return 'In tune';
}

function rotate<T>(items: readonly T[], start: number, count: number): T[] {
  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]);
}

export function stringQuestion(
  seed: number,
  round: number,
  difficulty: StarterDifficulty = 'challenge',
) {
  const answerIndex = Math.abs(Math.floor(seed * 10_000) + round * 7) % STRING_NAMES.length;
  const distractors = rotate(STRING_NAMES, answerIndex + 1, 3);
  const optionCount = difficulty === 'guided' ? 3 : 4;
  return {
    answer: STRING_NAMES[answerIndex],
    stringNumber: 6 - answerIndex,
    thickness: answerIndex < 3 ? 'thick' : 'thin',
    options: [STRING_NAMES[answerIndex], ...distractors].slice(0, optionCount).sort(),
  };
}

const GUIDED_CENTS = [-28, -16, 0, 2, 17, 31] as const;
const CHALLENGE_CENTS = [-28, -16, -8, -4, -3, -2, 0, 2, 3, 4, 9, 17, 31] as const;

export function tuneQuestion(
  seed: number,
  round: number,
  difficulty: StarterDifficulty = 'challenge',
) {
  const centsPool = difficulty === 'guided' ? GUIDED_CENTS : CHALLENGE_CENTS;
  const cents = centsPool[Math.abs(Math.floor(seed * 10_000) + round * 5) % centsPool.length];
  return {
    cents,
    answer: tuneChoiceForCents(cents),
    options: ['Tune up', 'In tune', 'Tune down'] as TuneChoice[],
  };
}

export function starterFeedback(
  gameId: StarterGameId,
  answer: string,
  cents?: number,
): string {
  if (gameId === 'string-scout') {
    return `${answer}. Guitar strings count from the thinnest string (1) toward the thickest (6).`;
  }
  if (answer === 'In tune') return `${cents ?? 0}¢ is inside the ±3¢ in-tune zone.`;
  return `${cents && cents > 0 ? '+' : ''}${cents ?? 0}¢ is ${answer === 'Tune up' ? 'flat, so raise the pitch' : 'sharp, so lower the pitch'}.`;
}

export function starterRoundScore(correct: number, total: number): number {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((correct / total) * 100)));
}
