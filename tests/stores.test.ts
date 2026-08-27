import { test, mock, before } from 'node:test';
import assert from 'node:assert/strict';

/**
 * A thread-isolated in-memory AsyncStorage. Each test file runs in its own
 * process, so this backs every persistence assertion in this file.
 */
function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    entries,
    getItem: async (key: string) => (entries.has(key) ? entries.get(key)! : null),
    setItem: async (key: string, value: string) => void entries.set(key, value),
    removeItem: async (key: string) => void entries.delete(key),
  };
}

const mem = memoryStorage();
mock.module('@react-native-async-storage/async-storage', {
  defaultExport: mem,
});

// Loaded lazily: mock.module must run before the stores are imported, and the
// stores are singletons that import once. `before` guarantees the imports are
// finished before any test body runs.
let useProgressStore: typeof import('../features/store/progressStore').useProgressStore;
let useSettingsStore: typeof import('../features/store/settingsStore').useSettingsStore;
let useUserPreferencesStore: typeof import('../features/store/userPreferencesStore').useUserPreferencesStore;

before(async () => {
  const [p, s, u] = await Promise.all([
    import('../features/store/progressStore'),
    import('../features/store/settingsStore'),
    import('../features/store/userPreferencesStore'),
  ]);
  useProgressStore = p.useProgressStore;
  useSettingsStore = s.useSettingsStore;
  useUserPreferencesStore = u.useUserPreferencesStore;
});

const DAY = new Date(2026, 2, 15, 19, 30); // a fixed local evening
const NEXT = new Date(2026, 2, 16, 8, 0);
const LATER = new Date(2026, 2, 20, 12, 0);

function resetProgress() {
  useProgressStore.setState({
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
  });
}

// ---------------------------------------------------------------------------
// progressStore — lesson completion, scores, favourites
// ---------------------------------------------------------------------------

test('completing a lesson keeps the best score, never the worst', () => {
  resetProgress();
  useProgressStore.getState().completeLesson('beginner-open-chords', 70);
  assert.equal(useProgressStore.getState().getLessonScore('beginner-open-chords'), 70);
  assert.equal(useProgressStore.getState().isLessonCompleted('beginner-open-chords'), true);
  useProgressStore.getState().completeLesson('beginner-open-chords', 90);
  assert.equal(useProgressStore.getState().getLessonScore('beginner-open-chords'), 90, 'higher score wins');
  useProgressStore.getState().completeLesson('beginner-open-chords', 40);
  assert.equal(useProgressStore.getState().getLessonScore('beginner-open-chords'), 90, 'a retake must not lower the stored score');
  assert.equal(useProgressStore.getState().isLessonCompleted('does-not-exist'), false);
  assert.equal(useProgressStore.getState().getLessonScore('does-not-exist'), 0);
});

test('game scores keep only the best and report whether it landed', () => {
  resetProgress();
  const { recordGameScore } = useProgressStore.getState();
  assert.equal(recordGameScore('chord-quiz', 120), true);
  assert.equal(useProgressStore.getState().gameHighScores['chord-quiz'], 120);
  assert.equal(recordGameScore('chord-quiz', 180), true);
  assert.equal(useProgressStore.getState().gameHighScores['chord-quiz'], 180);
  assert.equal(recordGameScore('chord-quiz', 100), false, 'lower score must be rejected');
  assert.equal(useProgressStore.getState().gameHighScores['chord-quiz'], 180);
  assert.equal(recordGameScore('chord-quiz', 180), false, 'a tie is not a new best');
  assert.equal(recordGameScore('chord-changes', 90), true, 'different games score independently');
});

test('favourites are a simple toggle list', () => {
  resetProgress();
  const s = useProgressStore.getState();
  s.addFavoriteChord('Em');
  s.addFavoriteChord('C');
  assert.deepEqual(useProgressStore.getState().favoriteChords, ['Em', 'C']);
  s.removeFavoriteChord('Em');
  assert.deepEqual(useProgressStore.getState().favoriteChords, ['C']);
  s.removeFavoriteChord('C');
  assert.deepEqual(useProgressStore.getState().favoriteChords, []);
});

// ---------------------------------------------------------------------------
// progressStore — practice accounting and streaks
// ---------------------------------------------------------------------------

test('recordPractice ignores junk input', () => {
  resetProgress();
  const s = useProgressStore.getState();
  s.recordPractice(0, DAY);
  s.recordPractice(-30, DAY);
  s.recordPractice(Number.NaN, DAY);
  s.recordPractice(Number.POSITIVE_INFINITY, DAY);
  assert.deepEqual(useProgressStore.getState().practiceLog, {});
});

test('practice accrues into the local day and moves the streak', () => {
  resetProgress();
  const first = useProgressStore.getState();
  first.recordPractice(90, DAY);
  let state = useProgressStore.getState();
  assert.equal(state.practiceSecondsToday(DAY), 90);
  assert.equal(state.currentStreak, 1);
  assert.equal(state.longestStreak, 1);
  assert.equal(state.totalPracticeMinutes, 1); // 90s floors to 1 minute

  // Same day accumulates seconds but must not inflate the streak.
  state.recordPractice(90, DAY);
  state = useProgressStore.getState();
  assert.equal(state.practiceSecondsToday(DAY), 180);
  assert.equal(state.currentStreak, 1);
  assert.equal(state.totalPracticeMinutes, 3); // 180s = 3
});

test('practising the next day extends the streak; a gap resets it', () => {
  resetProgress();
  useProgressStore.getState().recordPractice(60, DAY);
  useProgressStore.getState().recordPractice(60, NEXT);
  assert.equal(useProgressStore.getState().currentStreak, 2);
  assert.equal(useProgressStore.getState().longestStreak, 2);

  // A three-day gap starts the streak over at one.
  useProgressStore.getState().recordPractice(60, LATER);
  const state = useProgressStore.getState();
  assert.equal(state.currentStreak, 1);
  assert.equal(state.longestStreak, 2, 'the old peak must be remembered');
  assert.equal(state.liveStreak(LATER), 1);
});

test('a lapsed streak reads as zero until it is fed again', () => {
  resetProgress();
  useProgressStore.getState().recordPractice(60, DAY);
  assert.equal(useProgressStore.getState().liveStreak(DAY), 1);
  // Ten days of silence: the streak is gone for display purposes.
  const silent = new Date(2026, 2, 25, 12, 0);
  assert.equal(useProgressStore.getState().liveStreak(silent), 0);
  // Yesterday keeps the streak alive for one more day.
  assert.equal(useProgressStore.getState().liveStreak(NEXT), 1);
});

test('a backwards clock cannot corrupt the streak', () => {
  resetProgress();
  useProgressStore.getState().recordPractice(60, LATER);
  useProgressStore.getState().recordPractice(60, DAY); // earlier than last
  const state = useProgressStore.getState();
  assert.equal(state.currentStreak, 1);
  assert.equal(state.lastPracticeDate, '2026-03-20', 'the later session stays the anchor');
});

test('recordChordAttempt feeds the chord stats ledger', () => {
  resetProgress();
  useProgressStore.getState().recordChordAttempt('Em', true, DAY);
  useProgressStore.getState().recordChordAttempt('Em', true, DAY);
  useProgressStore.getState().recordChordAttempt('Em', false, DAY);
  const em = useProgressStore.getState().chordStats['Em'];
  assert.ok(em);
  assert.equal(em.attempts, 3);
  assert.equal(em.correct, 2);
  assert.equal(em.lastAt, '2026-03-15');
});

// ---------------------------------------------------------------------------
// progressStore — persistence
// ---------------------------------------------------------------------------

test('state changes are written to AsyncStorage under the progress key', async () => {
  resetProgress();
  mem.entries.delete('standardtune-progress');
  useProgressStore.getState().recordPractice(60, DAY);
  useProgressStore.getState().completeLesson('advanced-techniques', 88);
  await new Promise((r) => setTimeout(r, 0)); // persist writes on a microtask
  const raw = mem.entries.get('standardtune-progress');
  assert.ok(raw, 'nothing was persisted under standardtune-progress');
  const parsed = JSON.parse(raw) as { state: Record<string, unknown> };
  const practiceLog = parsed.state.practiceLog as Record<string, number>;
  const completed = parsed.state.completedLessons as Record<
    string,
    { score?: number }
  >;
  assert.equal(practiceLog['2026-03-15'], 60);
  assert.equal(parsed.state.currentStreak, 1);
  assert.equal(completed['advanced-techniques']?.score, 88);
});

test('rehydrating restores previously persisted lesson progress', async () => {
  resetProgress();
  mem.entries.set(
    'standardtune-progress',
    JSON.stringify({
      state: {
        completedLessons: { 'beginner-open-chords': { lessonId: 'beginner-open-chords', completed: true, score: 95 } },
        currentStreak: 3,
        longestStreak: 5,
        totalPracticeMinutes: 12,
        practiceLog: { '2026-03-14': 120, '2026-03-15': 600 },
        lastPracticeDate: '2026-03-15',
        favoriteChords: ['G'],
        gameHighScores: { 'chord-quiz': 200 },
        chordStats: {},
        alternateTuning: 'Standard E',
      },
      version: 0,
    })
  );
  await useProgressStore.persist.rehydrate();
  const state = useProgressStore.getState();
  assert.equal(state.getLessonScore('beginner-open-chords'), 95);
  assert.equal(state.isLessonCompleted('beginner-open-chords'), true);
  assert.equal(state.currentStreak, 3);
  assert.equal(state.longestStreak, 5);
  assert.equal(state.practiceSecondsToday(DAY), 600);
  assert.deepEqual(state.favoriteChords, ['G']);
});

// ---------------------------------------------------------------------------
// settingsStore
// ---------------------------------------------------------------------------

test('settings start with sane defaults', () => {
  const s = useSettingsStore.getState();
  assert.equal(s.soundsEnabled, true);
  assert.equal(s.sampleVolume, 75);
  assert.equal(s.practiceGoalMinutes, 15);
});

test('sample volume is clamped to 0-100 and rounded', () => {
  const s = useSettingsStore.getState();
  s.setSampleVolume(120);
  assert.equal(useSettingsStore.getState().sampleVolume, 100);
  s.setSampleVolume(-5);
  assert.equal(useSettingsStore.getState().sampleVolume, 0);
  s.setSampleVolume(73.7);
  assert.equal(useSettingsStore.getState().sampleVolume, 74);
  s.setSampleVolume(50.2);
  assert.equal(useSettingsStore.getState().sampleVolume, 50);
});

test('practice goal is clamped to a sane 5-120 range', () => {
  const s = useSettingsStore.getState();
  s.setPracticeGoalMinutes(3);
  assert.equal(useSettingsStore.getState().practiceGoalMinutes, 5);
  s.setPracticeGoalMinutes(999);
  assert.equal(useSettingsStore.getState().practiceGoalMinutes, 120);
  s.setPracticeGoalMinutes(30);
  assert.equal(useSettingsStore.getState().practiceGoalMinutes, 30);
});

// ---------------------------------------------------------------------------
// userPreferencesStore
// ---------------------------------------------------------------------------

test('user preferences start un-answered on acoustic standard beginner', () => {
  const s = useUserPreferencesStore.getState();
  assert.equal(s.guitarType, 'acoustic');
  assert.equal(s.experienceLevel, 'beginner');
  assert.equal(s.tuningPreference, 'standard');
  assert.equal(s.hasCompletedQuestionnaire, false);
});

test('questionnaire setters write through and can be re-run', () => {
  const s = useUserPreferencesStore.getState();
  s.setGuitarType('electric');
  s.setExperienceLevel('advanced');
  s.setTuningPreference('drop_d');
  s.completeQuestionnaire();
  let state = useUserPreferencesStore.getState();
  assert.equal(state.guitarType, 'electric');
  assert.equal(state.experienceLevel, 'advanced');
  assert.equal(state.tuningPreference, 'drop_d');
  assert.equal(state.hasCompletedQuestionnaire, true);

  state.resetQuestionnaire();
  assert.equal(useUserPreferencesStore.getState().hasCompletedQuestionnaire, false);
});

test('the hydration flag is transient and never persisted', async () => {
  mem.entries.delete('standardtune-user-preferences');
  useUserPreferencesStore.getState().setHasHydrated(true);
  await new Promise((r) => setTimeout(r, 0));
  const raw = mem.entries.get('standardtune-user-preferences');
  assert.ok(raw, 'preferences should be persisted');
  const parsed = JSON.parse(raw) as { state: Record<string, unknown> };
  assert.ok(!('hasHydrated' in parsed.state), 'hasHydrated leaked into storage');
});

test('a withdrawn guitar type is migrated on load, and hydration is flagged', async () => {
  mem.entries.set(
    'standardtune-user-preferences',
    JSON.stringify({
      state: {
        guitarType: 'bass',
        experienceLevel: 'intermediate',
        tuningPreference: 'standard',
        hasCompletedQuestionnaire: false,
      },
      version: 0,
    })
  );
  await useUserPreferencesStore.persist.rehydrate();
  const state = useUserPreferencesStore.getState();
  assert.equal(state.hasHydrated, true, 'hydration must be signalled after load');
  assert.equal(state.guitarType, 'electric', 'the closest supported type is electric');
  assert.equal(state.experienceLevel, 'intermediate');
});