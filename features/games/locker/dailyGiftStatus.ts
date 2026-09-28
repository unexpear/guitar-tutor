import { nextStreak, streakAsOf } from '../../practice/streak';

/** Presentation only: claiming and reward odds remain owned by the reward store. */
export function dailyGiftStatus(lastClaim: string | null, storedStreak: number, today: string) {
  const claimed = !!lastClaim && lastClaim >= today;
  const futureDate = !!lastClaim && lastClaim > today;
  const next = claimed ? storedStreak + 1 : nextStreak(lastClaim, storedStreak, today);
  return {
    claimed,
    futureDate,
    streak: streakAsOf(lastClaim, storedStreak, today),
    claimsUntilRare: (7 - next % 7) % 7 + 1,
  };
}
