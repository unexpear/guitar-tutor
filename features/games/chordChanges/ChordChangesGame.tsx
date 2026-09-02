import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTuner as useTunerEngine } from 'react-native-tuner-engine';
import { Colors } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import ChordDiagram from '../../../components/ChordDiagram';
import { Chord, getChord } from '../../chords/data/chords';
import { TargetMatcher, DetectionMode } from '../../lessons/playalong/matcher';
import { useProgressStore } from '../../store/progressStore';
import { usePracticeTimer } from '../../practice/usePracticeTimer';
import { useMicReleaseOnLeave } from '../../audio/useMicReleaseOnLeave';
import { useSettingsStore } from '../../store/settingsStore';
import { guitarPracticeEngineOptions } from '../../tuner/data/instrumentProfiles';
import {
  ROUND_SECONDS,
  SUGGESTED_PAIRS,
  pairKey,
  pickerChords,
  rateChanges,
  ratingBlurb,
} from './changes';

export const CHORD_CHANGES_ID = 'chord-changes';

type Phase = 'setup' | 'running' | 'done';

export default function ChordChangesGame({
  onExit,
  initialPair,
}: {
  onExit: () => void;
  /** Prefill, e.g. when arriving from a song's chord list. */
  initialPair?: [string, string];
}) {
  const referencePitchHz = useSettingsStore((state) => state.referencePitchHz);
  const engineOptions = useMemo(
    () => guitarPracticeEngineOptions(referencePitchHz),
    [referencePitchHz],
  );
  const engine = useTunerEngine(engineOptions);
  const { start, stop, latest, isRunning, error } = engine;
  usePracticeTimer(isRunning);
  useMicReleaseOnLeave(stop, isRunning);

  const recordGameScore = useProgressStore((s) => s.recordGameScore);
  const recordChordAttempt = useProgressStore((s) => s.recordChordAttempt);
  const highScores = useProgressStore((s) => s.gameHighScores);

  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<DetectionMode>('poly');
  const [names, setNames] = useState<[string, string]>(() => {
    const [a, b] = initialPair ?? [];
    return a && b && a !== b && getChord(a) && getChord(b) ? [a, b] : ['Em', 'Am'];
  });
  const [editing, setEditing] = useState<0 | 1 | null>(null);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0); // index into `names`
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [beatBest, setBeatBest] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const startPendingRef = useRef(false);

  const chords = useMemo(
    () => names.map((n) => getChord(n)).filter((c): c is Chord => !!c),
    [names]
  );
  const options = useMemo(() => pickerChords(), []);
  const best = highScores[pairKey(names[0], names[1])] ?? 0;

  const matcherRef = useRef<TargetMatcher | null>(null);
  const currentRef = useRef(0);
  // The countdown fires from an interval, so it needs the live count without
  // waiting for a re-render.
  const countRef = useRef(0);
  // A strum that lands right as the target flips would otherwise score the
  // new chord instantly.
  const armedAtRef = useRef(0);

  const armFor = useCallback(
    (index: number) => {
      const chord = chords[index];
      if (!chord) return;
      matcherRef.current = new TargetMatcher(
        { kind: 'chord', chordName: chord.name, label: chord.name },
        { mode, referencePitchHz },
      );
      armedAtRef.current = Date.now();
    },
    [chords, mode, referencePitchHz]
  );

  const begin = useCallback(async () => {
    if (chords.length < 2 || startPendingRef.current || isRunning) return;
    startPendingRef.current = true;
    setIsStarting(true);
    try {
      await start();
      setCount(0);
      countRef.current = 0;
      setCurrent(0);
      currentRef.current = 0;
      setSecondsLeft(ROUND_SECONDS);
      setBeatBest(false);
      armFor(0);
      setPhase('running');
    } catch {
      // The engine exposes the actionable permission/start error in `error`.
      // Stay on setup instead of starting a timer with no microphone.
    } finally {
      startPendingRef.current = false;
      setIsStarting(false);
    }
  }, [armFor, chords.length, isRunning, start]);

  const finish = useCallback(() => {
    stop();
    setPhase('done');
    setBeatBest(recordGameScore(pairKey(names[0], names[1]), countRef.current));
  }, [stop, recordGameScore, names]);

  // Countdown.
  useEffect(() => {
    if (phase !== 'running') return;
    const endsAt = Date.now() + secondsLeft * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) finish();
    }, 200);
    return () => clearInterval(id);
    // secondsLeft is deliberately not a dependency: the interval owns it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, finish]);

  // Feed the pitch stream to the matcher for whichever chord is due.
  useEffect(() => {
    if (phase !== 'running' || !latest || !latest.hasPitch) return;
    const matcher = matcherRef.current;
    if (!matcher) return;
    if (Date.now() - armedAtRef.current < 250) return;

    const event = matcher.feed({
      frequency: latest.frequency,
      confidence: latest.confidence,
      rmsDb: latest.rmsDb,
      tMs: Date.now(),
    });

    if (event === 'hit') {
      // The chord that was just heard is the one that was due.
      recordChordAttempt(names[currentRef.current], true);
      countRef.current += 1;
      setCount(countRef.current);
      const next = currentRef.current === 0 ? 1 : 0;
      currentRef.current = next;
      setCurrent(next);
      armFor(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest, phase]);

  // Release the mic on the way out. stop() is async; the cleanup must not
  // return its promise.
  useEffect(
    () => () => {
      void stop();
    },
    [stop]
  );

  const setName = (slot: 0 | 1, name: string) => {
    setNames((prev) => {
      const next: [string, string] = [prev[0], prev[1]];
      next[slot] = name;
      // Two of the same chord is not a change.
      if (next[0] === next[1]) next[slot === 0 ? 1 : 0] = prev[slot];
      return next;
    });
    setEditing(null);
  };

  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <Header title="Chord Changes" onExit={onExit} />
        <ScrollView contentContainerStyle={styles.setupBody}>
          <Text style={styles.lead}>
            One minute, two chords, back and forth. Count how many clean
            changes you make. The hard part of playing chords was never
            holding one - it is arriving at the next one in time.
          </Text>

          <View style={styles.pairRow}>
            {[0, 1].map((slot) => {
              const chord = chords[slot];
              return (
                <PressableScale
                  key={slot}
                  style={styles.pairSlot}
                  onPress={() => setEditing(editing === slot ? null : (slot as 0 | 1))}
                  accessibilityRole="button"
                  accessibilityLabel={`Change chord ${slot + 1}, currently ${names[slot]}`}
                >
                  {chord && <ChordDiagram chord={chord} small />}
                  <Text style={styles.pairName}>{names[slot]}</Text>
                  <Text style={styles.pairTapHint}>tap to change</Text>
                </PressableScale>
              );
            })}
          </View>

          {editing !== null && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {options.map((c) => (
                <PressableScale
                  key={c.name}
                  style={[styles.chip, names[editing] === c.name && styles.chipActive]}
                  onPress={() => setName(editing, c.name)}
                  accessibilityRole="button"
                  accessibilityLabel={c.name}
                >
                  <Text
                    style={[
                      styles.chipText,
                      names[editing] === c.name && styles.chipTextActive,
                    ]}
                  >
                    {c.name}
                  </Text>
                </PressableScale>
              ))}
            </ScrollView>
          )}

          <Text style={styles.sectionLabel}>OR START FROM A COMMON PAIR</Text>
          <View style={styles.suggestWrap}>
            {SUGGESTED_PAIRS.map(([a, b]) => (
              <PressableScale
                key={`${a}-${b}`}
                style={styles.suggest}
                onPress={() => {
                  setNames([a, b]);
                  setEditing(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${a} to ${b}`}
              >
                <Text style={styles.suggestText}>
                  {a} → {b}
                </Text>
              </PressableScale>
            ))}
          </View>

          <Text style={styles.sectionLabel}>HOW STRICT?</Text>
          <View style={styles.modeRow}>
            <PressableScale
              style={[styles.modeBtn, mode === 'mono' && styles.modeBtnActive]}
              onPress={() => setMode('mono')}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'mono' }}
            >
              <Text style={[styles.modeText, mode === 'mono' && styles.modeTextActive]}>
                Any tone
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.modeBtn, mode === 'poly' && styles.modeBtnActive]}
              onPress={() => setMode('poly')}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'poly' }}
            >
              <Text style={[styles.modeText, mode === 'poly' && styles.modeTextActive]}>
                Full chord
              </Text>
            </PressableScale>
          </View>
          <Text style={styles.modeHint}>
            {mode === 'poly'
              ? 'A change only counts when enough of the new chord actually rings. This is the honest setting.'
              : 'Any note from the new chord counts. Forgiving, but a muted change will score.'}
          </Text>

          {best > 0 && (
            <Text style={styles.bestLine}>
              Best for {names[0]} ↔ {names[1]}: {best}
            </Text>
          )}

          {error ? <Text style={styles.error}>{String(error)}</Text> : null}

          <PressableScale
            style={[styles.primaryBtn, isStarting && styles.disabledBtn]}
            onPress={begin}
            disabled={isStarting}
            accessibilityRole="button"
            accessibilityState={{ disabled: isStarting }}
          >
            <Ionicons name="mic" size={18} color="#0b2410" />
            <Text style={styles.primaryBtnText}>
              {isStarting ? 'Starting…' : 'Start the minute'}
            </Text>
          </PressableScale>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'done') {
    const rating = rateChanges(count);
    return (
      <View style={styles.container}>
        <Header title="Chord Changes" onExit={onExit} />
        <Animated.View entering={FadeIn} style={styles.doneBody}>
          <Text style={styles.doneCount}>{count}</Text>
          <Text style={styles.doneLabel}>
            CHANGES · {names[0].toUpperCase()} ↔ {names[1].toUpperCase()}
          </Text>
          {beatBest && <Text style={styles.doneBest}>New best for this pair</Text>}
          <Text style={styles.doneRating}>{rating}</Text>
          <Text style={styles.doneBlurb}>{ratingBlurb(rating)}</Text>

          <PressableScale
            style={styles.primaryBtn}
            onPress={begin}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Go again</Text>
          </PressableScale>
          <PressableScale
            style={styles.secondaryBtn}
            onPress={() => setPhase('setup')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>Pick different chords</Text>
          </PressableScale>
        </Animated.View>
      </View>
    );
  }

  const chord = chords[current];
  return (
    <View style={styles.container}>
      <Header title="Chord Changes" onExit={onExit} />
      <View style={styles.runBody}>
        <Text style={styles.clock}>{secondsLeft}</Text>
        <Text style={styles.clockLabel}>SECONDS LEFT</Text>

        <Text style={styles.runCount}>{count}</Text>
        <Text style={styles.runCountLabel}>CHANGES</Text>

        <Text style={styles.nowPlay}>PLAY</Text>
        {chord && (
          <>
            <Text style={styles.nowName}>{chord.name}</Text>
            <ChordDiagram chord={chord} />
          </>
        )}

        <View style={[styles.listenPill, isRunning && styles.listenPillLive]}>
          <Ionicons
            name={isRunning ? 'mic' : 'mic-off'}
            size={16}
            color={isRunning ? Colors.success : Colors.dark.muted}
          />
          <Text style={styles.listenText}>
            {isRunning ? 'Listening' : 'Mic paused'}
          </Text>
        </View>

        <PressableScale
          style={styles.secondaryBtn}
          onPress={finish}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryBtnText}>Stop early</Text>
        </PressableScale>
      </View>
    </View>
  );
}

function Header({ title, onExit }: { title: string; onExit: () => void }) {
  return (
    <View style={styles.header}>
      <PressableScale
        style={styles.closeBtn}
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel="Leave the exercise"
      >
        <Ionicons name="close" size={22} color={Colors.dark.text} />
      </PressableScale>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.dark.text },

  setupBody: { paddingHorizontal: 20, paddingBottom: 130, gap: 14 },
  lead: { fontSize: 15, lineHeight: 22, color: Colors.dark.muted },

  pairRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  pairSlot: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 12,
  },
  pairName: { fontSize: 18, fontWeight: '800', color: Colors.dark.text },
  pairTapHint: { fontSize: 10, color: Colors.dark.muted },

  chipRow: { gap: 8, paddingVertical: 4, paddingRight: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  chipActive: { backgroundColor: Colors.success },
  chipText: { fontSize: 14, fontWeight: '700', color: Colors.dark.text },
  chipTextActive: { color: '#0b2410' },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.dark.muted,
    marginTop: 6,
  },
  suggestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggest: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  suggestText: { fontSize: 13, fontWeight: '700', color: Colors.dark.text },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  modeBtnActive: { backgroundColor: Colors.success },
  modeText: { fontSize: 14, fontWeight: '700', color: Colors.dark.muted },
  modeTextActive: { color: '#0b2410' },
  modeHint: { fontSize: 12, lineHeight: 17, color: Colors.dark.muted },

  bestLine: { fontSize: 14, fontWeight: '700', color: Colors.success },
  error: { fontSize: 13, color: Colors.danger },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 15,
    // Needed because this button is centred (and so content-sized) on the
    // results screen, where it would otherwise hug the label.
    paddingHorizontal: 34,
    borderRadius: 14,
    marginTop: 8,
    alignSelf: 'stretch',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#0b2410' },
  disabledBtn: { opacity: 0.55 },
  secondaryBtn: { paddingHorizontal: 28, paddingVertical: 12, marginTop: 6 },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.dark.muted },

  runBody: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  clock: {
    fontSize: 46,
    fontWeight: '800',
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
  },
  clockLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.dark.muted,
  },
  runCount: {
    fontSize: 54,
    fontWeight: '800',
    color: Colors.dark.text,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  runCountLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.dark.muted,
  },
  nowPlay: {
    marginTop: 18,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.success,
  },
  nowName: { fontSize: 34, fontWeight: '800', color: Colors.dark.text },

  listenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  listenPillLive: { backgroundColor: 'rgba(76,175,80,0.14)' },
  listenText: { fontSize: 13, fontWeight: '700', color: Colors.dark.muted },

  doneBody: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 100 },
  doneCount: { fontSize: 72, fontWeight: '800', color: Colors.dark.text },
  doneLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.dark.muted,
  },
  doneBest: { marginTop: 12, fontSize: 15, fontWeight: '800', color: Colors.success },
  doneRating: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.warning,
    textTransform: 'capitalize',
  },
  doneBlurb: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.dark.muted,
    textAlign: 'center',
  },
});
