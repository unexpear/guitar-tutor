import { CHORDS, Chord } from '../../chords/data/chords';
import { findBarres } from '../../chords/data/barres';

/**
 * Question generation for Chord Quiz.
 *
 * The whole difficulty of a multiple-choice music quiz lives in the wrong
 * answers. Four chords drawn at random are trivial — nobody confuses Em with
 * Bdim. The distractors here are chosen to be the chords a learner actually
 * mixes up: the same root with a different quality (A vs Am vs A7), and
 * shapes that sit under nearly the same fingers.
 */

export type QuizMode = 'name-from-diagram' | 'diagram-from-name' | 'name-from-sound';

export const QUIZ_MODES: QuizMode[] = [
  'name-from-diagram',
  'diagram-from-name',
  'name-from-sound',
];

export type QuizLevel = 'beginner' | 'all';

export const OPTIONS_PER_QUESTION = 4;

export interface QuizQuestion {
  mode: QuizMode;
  answer: Chord;
  /** Shuffled, contains the answer exactly once. */
  options: Chord[];
}

/** Deterministic RNG so a quiz can be reproduced in a test. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The letter a chord name starts with, plus any accidental: Am7 -> A, C#m -> C#. */
export function rootOf(name: string): string {
  return /^[A-G][#b]?/.exec(name)?.[0] ?? name;
}

/** True if the shape needs a finger flattened across strings. */
export function isBarreChord(chord: Chord): boolean {
  return findBarres(chord).length > 0;
}

/**
 * How different two shapes feel under the hand. Lower means more confusable,
 * which makes for a better wrong answer.
 */
export function shapeDistance(a: Chord, b: Chord): number {
  let total = 0;
  for (let i = 0; i < 6; i++) {
    const x = a.strings[i];
    const y = b.strings[i];
    if (x === y) continue;
    // Muting a string versus sounding it is a bigger difference than moving
    // a finger one fret, but not an unbridgeable one.
    total += x < 0 || y < 0 ? 2 : Math.min(3, Math.abs(x - y));
  }
  return total;
}

/** Chords a quiz at this level is allowed to ask about. */
export function poolForLevel(level: QuizLevel, all: Chord[] = CHORDS): Chord[] {
  if (level === 'all') return all;
  // Beginner: open shapes only. Asking someone to identify an Ab barre by
  // sight before they can play one is a trivia question, not practice.
  return all.filter((c) => !isBarreChord(c));
}

/**
 * Pick wrong answers for a question. Prefers one chord sharing the answer's
 * root, then fills from the most hand-similar shapes.
 */
export function pickDistractors(
  answer: Chord,
  pool: Chord[],
  count: number,
  rand: () => number
): Chord[] {
  const candidates = pool.filter((c) => c.name !== answer.name);
  const chosen: Chord[] = [];

  const sameRoot = candidates.filter((c) => rootOf(c.name) === rootOf(answer.name));
  if (sameRoot.length > 0 && count > 0) {
    chosen.push(shuffle(sameRoot, rand)[0]);
  }

  // Fill the rest from the nearest shapes, with a little slack so the same
  // three distractors do not follow a chord around every time it appears.
  const remaining = candidates
    .filter((c) => !chosen.some((p) => p.name === c.name))
    .sort((x, y) => shapeDistance(answer, x) - shapeDistance(answer, y));

  const shortlist = remaining.slice(0, Math.max(count * 3, count));
  for (const c of shuffle(shortlist, rand)) {
    if (chosen.length >= count) break;
    chosen.push(c);
  }

  // Tiny pools (a filtered library, a test fixture) may not have enough
  // similar shapes; take whatever is left rather than returning short.
  for (const c of remaining) {
    if (chosen.length >= count) break;
    if (!chosen.some((p) => p.name === c.name)) chosen.push(c);
  }

  return chosen;
}

export function buildQuestion(
  answer: Chord,
  pool: Chord[],
  mode: QuizMode,
  rand: () => number
): QuizQuestion {
  const distractors = pickDistractors(answer, pool, OPTIONS_PER_QUESTION - 1, rand);
  return { mode, answer, options: shuffle([answer, ...distractors], rand) };
}

/**
 * Build a whole round. The same chord never comes up twice in a row, and
 * modes rotate so a round is not ten of the same kind of question.
 */
export function buildQuiz(
  length: number,
  level: QuizLevel = 'beginner',
  rand: () => number = Math.random,
  modes: QuizMode[] = QUIZ_MODES
): QuizQuestion[] {
  // A round with no playable modes would be an infinite loop of nothing.
  if (modes.length === 0) return [];
  const pool = poolForLevel(level);
  if (pool.length < OPTIONS_PER_QUESTION) return [];

  const questions: QuizQuestion[] = [];
  let bag: Chord[] = [];
  let previous: string | null = null;

  for (let i = 0; i < length; i++) {
    if (bag.length === 0) bag = shuffle(pool, rand);
    // Refill draws can repeat the chord that just ended the last bag.
    let idx = bag.findIndex((c) => c.name !== previous);
    if (idx < 0) idx = 0;
    const answer = bag.splice(idx, 1)[0];
    previous = answer.name;
    questions.push(buildQuestion(answer, pool, modes[i % modes.length], rand));
  }

  return questions;
}

/** Points for a correct answer, with a bonus for a run of them. */
export function scoreForAnswer(streakBefore: number): number {
  return 10 + Math.min(streakBefore, 5) * 2;
}
