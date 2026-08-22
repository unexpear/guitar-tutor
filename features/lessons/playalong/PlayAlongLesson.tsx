import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTuner as useTunerEngine } from 'react-native-tuner-engine';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import ChordDiagram from '../../../components/ChordDiagram';
import PressableScale from '../../../components/PressableScale';
import { getChord, NOTE_NAMES } from '../../chords/data/chords';
import { useSettingsStore } from '../../store/settingsStore';
import { Drill } from '../data/drills';
import { TargetMatcher, Target, DetectionMode } from './matcher';
import { createBeatClock, BeatClock, gradeTiming, TimingVerdict } from '../../timing/beatClock';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const ACCENT_CLICK = require('../../../assets/audio/click-accent.wav');
const REGULAR_CLICK = require('../../../assets/audio/click.wav');

type Pace = 'wait' | 'flow';
type TargetStatus = 'pending' | 'hit' | 'miss';

const CHIP_W = 84;
const CHIP_GAP = 10;
const HIT_COOLDOWN_MS = 650;
const STRUM_COOLDOWN_MS = 350;
const WRONG_COOLDOWN_MS = 450;
const PASS_PERCENT = 70;

/** Tab-convention string labels, top row = high e. */
const TAB_ROWS = ['e', 'B', 'G', 'D', 'A', 'E']; // display order (stringIndex 5 -> 0)

function TabStrip({ target }: { target: Extract<Target, { kind: 'note' }> }) {
  return (
    <View style={styles.tabStrip}>
      {TAB_ROWS.map((label, row) => {
        const stringIndex = 5 - row;
        const active = stringIndex === target.stringIndex;
        return (
          <View key={label} style={styles.tabRow}>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
            <View style={styles.tabLineWrap}>
              <View style={[styles.tabLine, active && styles.tabLineActive]} />
              {active && (
                <View style={styles.tabFretBadge}>
                  <Text style={styles.tabFretText}>{target.fret}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PolyPips({
  targetClasses,
  heardClasses,
}: {
  targetClasses: number[];
  heardClasses: number[];
}) {
  const heard = new Set(heardClasses);
  return (
    <View style={styles.pipsRow}>
      <Text style={styles.pipsLabel}>Heard:</Text>
      {targetClasses.map((pc) => (
        <View key={pc} style={[styles.pip, heard.has(pc) && styles.pipHeard]}>
          <Text style={[styles.pipText, heard.has(pc) && styles.pipTextHeard]}>
            {NOTE_NAMES[pc]}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Tiny equalizer that breathes while the mic is live — the listening-state indicator. */
function ListeningBars({ live }: { live: boolean }) {
  const b1 = useSharedValue(1);
  const b2 = useSharedValue(1);
  const b3 = useSharedValue(1);

  useEffect(() => {
    const bounce = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.35, { duration: 300, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.55, { duration: 340, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        ),
      );
    if (live) {
      b1.value = bounce(0);
      b2.value = bounce(140);
      b3.value = bounce(280);
    } else {
      b1.value = withTiming(1, { duration: 200 });
      b2.value = withTiming(1, { duration: 200 });
      b3.value = withTiming(1, { duration: 200 });
    }
  }, [live, b1, b2, b3]);

  const s1 = useAnimatedStyle(() => ({ transform: [{ scaleY: b1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scaleY: b2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ scaleY: b3.value }] }));
  const liveStyle = live && styles.eqBarLive;

  return (
    <View style={styles.eqWrap}>
      <Animated.View style={[styles.eqBar, styles.eqBarShort, liveStyle, s1]} />
      <Animated.View style={[styles.eqBar, styles.eqBarTall, liveStyle, s2]} />
      <Animated.View style={[styles.eqBar, styles.eqBarMid, liveStyle, s3]} />
    </View>
  );
}

export default function PlayAlongLesson({
  drill,
  onClose,
  onComplete,
}: {
  drill: Drill;
  onClose: () => void;
  onComplete: (scorePercent: number) => void;
}) {
  const engine = useTunerEngine({
    instrument: 'guitar',
    a4: 440,
    minFrequency: 60,
    maxFrequency: 1400,
    confidenceThreshold: 0.5,
    noiseGateDb: -52,
    hysteresisFrames: 2,
    onsetDetection: true,
  });
  const { start, stop, latest, isRunning, error } = engine;

  const hasChordTargets = useMemo(
    () => drill.targets.some((t) => t.kind === 'chord'),
    [drill],
  );

  const [mode, setMode] = useState<DetectionMode>(drill.defaultMode);
  const [pace, setPace] = useState<Pace>('wait');
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [statuses, setStatuses] = useState<TargetStatus[]>(() =>
    drill.targets.map(() => 'pending'),
  );
  const [strumsLeft, setStrumsLeft] = useState<number>(
    drill.targets[0].kind === 'chord' ? drill.targets[0].strums ?? 1 : 1,
  );
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [heardState, setHeardState] = useState<{ target: number[]; heard: number[] }>({
    target: [],
    heard: [],
  });
  // Click-track state (only for drills that declare a bpm).
  const hasClick = !!drill.bpm;
  const [countIn, setCountIn] = useState<number | null>(null);
  const [beatInBar, setBeatInBar] = useState<number | null>(null);
  const [lastTiming, setLastTiming] = useState<TimingVerdict | null>(null);
  const lastBeatAtRef = useRef<number>(0);
  const clockRef = useRef<BeatClock | null>(null);
  const accentRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const clickRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const finished = idx >= drill.targets.length;

  const matcherRef = useRef<TargetMatcher | null>(null);
  const cooldownUntilRef = useRef(0);
  const idxRef = useRef(idx);
  idxRef.current = idx;

  const conveyorX = useSharedValue(0);
  const zonePulse = useSharedValue(1);
  const shakeX = useSharedValue(0);

  // (Re)build the matcher whenever the active target or mode changes.
  useEffect(() => {
    if (finished) return;
    const target = drill.targets[idx];
    matcherRef.current = new TargetMatcher(target, { mode });
    matcherRef.current.reset();
    setHeardState({
      target: matcherRef.current.state().targetClasses,
      heard: [],
    });
    setStrumsLeft(target.kind === 'chord' ? target.strums ?? 1 : 1);
  }, [drill, idx, mode, finished]);

  // Engine lifecycle.
  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click-track audio.
  useEffect(() => {
    if (!hasClick) return;
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }).catch(() => {});
    accentRef.current = createAudioPlayer(ACCENT_CLICK);
    clickRef.current = createAudioPlayer(REGULAR_CLICK);
    return () => {
      clockRef.current?.stop();
      accentRef.current?.release();
      clickRef.current?.release();
    };
  }, [hasClick]);

  const advance = useCallback(
    (status: TargetStatus) => {
      const current = idxRef.current;
      setStatuses((prev) => {
        const next = [...prev];
        next[current] = status;
        return next;
      });
      const nextIdx = current + 1;
      setIdx(nextIdx);
      conveyorX.value = withTiming(-nextIdx * (CHIP_W + CHIP_GAP), {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
    },
    [conveyorX],
  );

  const registerHit = useCallback(() => {
    if (hasClick && lastBeatAtRef.current) {
      setLastTiming(gradeTiming(Date.now() - lastBeatAtRef.current));
    }
    const target = drill.targets[idxRef.current];
    const totalStrums = target.kind === 'chord' ? target.strums ?? 1 : 1;

    zonePulse.value = withSequence(
      withTiming(1.15, { duration: 90 }),
      withTiming(1, { duration: 160 }),
    );

    setStrumsLeft((left) => {
      if (totalStrums > 1 && left > 1) {
        // Another strum of the same chord still owed.
        cooldownUntilRef.current = Date.now() + STRUM_COOLDOWN_MS;
        matcherRef.current?.reset();
        return left - 1;
      }
      cooldownUntilRef.current = Date.now() + HIT_COOLDOWN_MS;
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
      advance('hit');
      return 1;
    });
  }, [advance, drill, zonePulse, hasClick]);

  const registerWrong = useCallback(() => {
    setWrongCount((w) => w + 1);
    setStreak(0);
    cooldownUntilRef.current = Date.now() + WRONG_COOLDOWN_MS;
    shakeX.value = withSequence(
      withTiming(-8, { duration: 40 }),
      withTiming(8, { duration: 70 }),
      withTiming(-5, { duration: 60 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeX]);

  // Feed pitch events into the matcher.
  useEffect(() => {
    if (!started || finished || !latest || !latest.hasPitch) return;
    if (Date.now() < cooldownUntilRef.current) return;
    const matcher = matcherRef.current;
    if (!matcher) return;

    const event = matcher.feed({
      frequency: latest.frequency,
      confidence: latest.confidence,
      rmsDb: latest.rmsDb,
      tMs: Date.now(),
    });
    if (mode === 'poly') {
      const s = matcher.state();
      setHeardState({ target: s.targetClasses, heard: s.heardClasses });
    }
    if (event === 'hit') registerHit();
    else if (event === 'wrong') registerWrong();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest]);

  // Flow mode: the clock advances targets whether or not you hit them.
  useEffect(() => {
    if (!started || finished || pace !== 'flow') return;
    const target = drill.targets[idx];
    const strums = target.kind === 'chord' ? target.strums ?? 1 : 1;
    const timer = setTimeout(() => {
      setStreak(0);
      advance('miss');
    }, drill.secondsPerTarget * 1000 * Math.max(1, strums / 2));
    return () => clearTimeout(timer);
  }, [started, finished, pace, idx, drill, advance]);

  // Completion.
  const hits = statuses.filter((s) => s === 'hit').length;
  const attempts = hits + statuses.filter((s) => s === 'miss').length + wrongCount;
  const scorePercent = attempts === 0 ? 0 : Math.round((hits / attempts) * 100);
  const completedRef = useRef(false);
  useEffect(() => {
    if (finished && !completedRef.current) {
      completedRef.current = true;
      stop();
      clockRef.current?.stop();
      if (scorePercent >= PASS_PERCENT) onComplete(scorePercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const handleStart = useCallback(async () => {
    await start();
    setStarted(true);

    if (hasClick) {
      clockRef.current?.stop();
      clockRef.current = createBeatClock({
        getBpm: () => drill.bpm ?? 70,
        getBeatsPerBar: () => drill.beatsPerBar ?? 4,
        countInBeats: drill.beatsPerBar ?? 4,
        onCountIn: (remaining) => {
          setCountIn(remaining);
          const { soundsEnabled, sampleVolume } = useSettingsStore.getState();
          if (!soundsEnabled) return;
          const p = clickRef.current;
          if (p) { try { p.volume = sampleVolume / 100; p.seekTo(0); p.play(); } catch {} }
        },
        onStart: () => setCountIn(null),
        onBeat: (beat, scheduledAt) => {
          lastBeatAtRef.current = scheduledAt;
          setBeatInBar(beat);
          const { soundsEnabled, sampleVolume } = useSettingsStore.getState();
          if (!soundsEnabled) return;
          const p = beat === 0 ? accentRef.current : clickRef.current;
          if (p) { try { p.volume = sampleVolume / 100; p.seekTo(0); p.play(); } catch {} }
        },
      });
      clockRef.current.start();
    }
  }, [start, hasClick, drill]);

  const conveyorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: conveyorX.value }],
  }));
  const zoneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zonePulse.value }, { translateX: shakeX.value }],
  }));

  const target = finished ? null : drill.targets[idx];
  const targetChordData = target?.kind === 'chord' ? getChord(target.chordName) : null;
  const heardNote = started && latest?.hasPitch ? `${latest.noteName}${latest.octave}` : null;
  const listenLabel = !isRunning ? 'Mic paused' : heardNote ? `Heard ${heardNote}` : 'Listening…';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close practice"
        >
          <Ionicons name="close" size={26} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{drill.title}</Text>
          <Text style={styles.subtitle}>
            {hits}/{drill.targets.length} hit{wrongCount > 0 ? ` · ${wrongCount} slips` : ''}
            {streak > 1 ? ` · streak ${streak}` : ''}
          </Text>
        </View>
      </View>

      {/* Mode + pace toggles (hidden on the results screen so the end-state reads clean) */}
      {!finished && (
      <View style={styles.toggleRow}>
        {hasChordTargets && (
          <View>
            <Text style={styles.toggleCaption}>Detection</Text>
          <View style={styles.toggleGroup}>
            {(['mono', 'poly'] as DetectionMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
                onPress={() => setMode(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === m }}
              >
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'mono' ? 'Any tone' : 'Full chord'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          </View>
        )}
        <View>
          <Text style={styles.toggleCaption}>Pace</Text>
        <View style={styles.toggleGroup}>
          {(['wait', 'flow'] as Pace[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.toggleBtn, pace === p && styles.toggleBtnActive]}
              onPress={() => setPace(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: pace === p }}
            >
              <Text style={[styles.toggleText, pace === p && styles.toggleTextActive]}>
                {p === 'wait' ? 'Wait for me' : 'Keep moving'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        </View>
      </View>
      )}

      {/* Conveyor (also cleared once the drill is over) */}
      {!finished && (
      <View style={styles.conveyorWrap}>
        <View style={styles.hitZone} />
        <Animated.View style={[styles.conveyor, conveyorStyle]}>
          {drill.targets.map((t, i) => {
            const status = statuses[i];
            const isCurrent = i === idx;
            return (
              <View
                key={`${t.label}-${i}`}
                style={[
                  styles.chip,
                  isCurrent && styles.chipCurrent,
                  status === 'hit' && styles.chipHit,
                  status === 'miss' && styles.chipMiss,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    (isCurrent || status === 'hit') && styles.chipTextBright,
                  ]}
                >
                  {t.kind === 'chord' ? t.chordName : t.label}
                </Text>
                {t.kind === 'chord' && (t.strums ?? 1) > 1 && (
                  <Text style={styles.chipSub}>
                    {isCurrent ? `×${strumsLeft}` : `×${t.strums}`}
                  </Text>
                )}
                {status === 'hit' && (
                  <View style={styles.chipCheck}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>
      </View>
      )}

      {/* Stage */}
      <ScrollView
        contentContainerStyle={[styles.stage, started && !finished && styles.stageLive]}
        showsVerticalScrollIndicator={false}
      >
        {!started ? (
          <View style={styles.introBox}>
            <Ionicons name="mic-outline" size={40} color={Colors.success} />
            <Text style={styles.introText}>{drill.intro}</Text>
            {error && (
              <Text style={styles.errorText}>
                Microphone unavailable: {error.message}. Check the app's mic permission and try
                again.
              </Text>
            )}
            <PressableScale
              style={styles.startBtn}
              onPress={handleStart}
              accessibilityRole="button"
              accessibilityLabel="Start listening"
            >
              <Text style={styles.startBtnText}>
                {error ? 'Try Again' : 'Start Listening'}
              </Text>
            </PressableScale>
          </View>
        ) : finished ? (
          <View style={[styles.introBox, styles.finishBox]}>
            <Ionicons
              name={scorePercent >= PASS_PERCENT ? 'trophy-outline' : 'refresh-outline'}
              size={44}
              color={scorePercent >= PASS_PERCENT ? Colors.warning : Colors.dark.muted}
            />
            <Text style={styles.doneTitle}>
              {scorePercent >= PASS_PERCENT ? 'Nailed it!' : 'Keep at it'}
            </Text>
            <View style={styles.finishStatsRow}>
              <View style={styles.finishStatTile}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color={hits > 0 ? Colors.success : Colors.dark.muted}
                />
                <Text style={styles.finishStatValue}>
                  {hits}
                  <Text style={styles.finishStatDenom}>/{drill.targets.length}</Text>
                </Text>
                <Text style={styles.statLabel}>Targets</Text>
              </View>
              <View style={styles.finishStatTile}>
                <Ionicons
                  name="analytics-outline"
                  size={18}
                  color={scorePercent >= PASS_PERCENT ? Colors.success : Colors.dark.muted}
                />
                <Text
                  style={[
                    styles.finishStatValue,
                    scorePercent >= PASS_PERCENT && styles.finishStatValuePass,
                  ]}
                >
                  {scorePercent}
                  <Text style={styles.finishStatDenom}>%</Text>
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.finishStatTile}>
                <Ionicons
                  name="flame-outline"
                  size={18}
                  color={bestStreak > 0 ? Colors.warning : Colors.dark.muted}
                />
                <Text style={styles.finishStatValue}>{bestStreak}</Text>
                <Text style={styles.statLabel}>Best streak</Text>
              </View>
            </View>
            <Text style={styles.doneText}>
              {scorePercent >= PASS_PERCENT
                ? 'Lesson marked complete.'
                : `Reach ${PASS_PERCENT}% accuracy to complete the lesson.`}
            </Text>
            <PressableScale
              style={styles.startBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Finish practice"
            >
              <Text style={styles.startBtnText}>Done</Text>
            </PressableScale>
          </View>
        ) : (
          <>
            <Animated.View style={[styles.targetBox, styles.targetBoxLive, zoneStyle]}>
              <Text style={styles.targetEyebrow}>Play this</Text>
              <View style={styles.targetBody}>
                {target?.kind === 'chord' && targetChordData ? (
                  <>
                    <Text style={styles.targetName}>{target.chordName}</Text>
                    {(target.strums ?? 1) > 1 && (
                      <Text style={styles.strumCount}>
                        {strumsLeft} strum{strumsLeft === 1 ? '' : 's'} to go
                      </Text>
                    )}
                    <ChordDiagram chord={targetChordData} />
                  </>
                ) : target?.kind === 'note' ? (
                  <>
                    <Text style={styles.targetName}>
                      {TAB_ROWS[5 - target.stringIndex]} string ·{' '}
                      {target.fret === 0 ? 'open' : `fret ${target.fret}`}
                    </Text>
                    <TabStrip target={target} />
                  </>
                ) : null}
              </View>
              <View style={styles.cardFooter}>
                {hasClick && countIn !== null && (
                  <Text style={styles.countIn}>{countIn}</Text>
                )}
                {hasClick && countIn === null && (
                  <View style={styles.beatRow}>
                    {Array.from({ length: drill.beatsPerBar ?? 4 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.beatPip,
                          i === 0 && styles.beatPipDownbeat,
                          i === beatInBar && styles.beatPipActive,
                        ]}
                      />
                    ))}
                    {lastTiming && (
                      <Text
                        style={[
                          styles.timingText,
                          (lastTiming === 'perfect' || lastTiming === 'good') &&
                            styles.timingGood,
                        ]}
                      >
                        {lastTiming === 'perfect'
                          ? 'On the beat'
                          : lastTiming === 'good'
                          ? 'Close'
                          : lastTiming === 'early'
                          ? 'Early'
                          : 'Late'}
                      </Text>
                    )}
                  </View>
                )}
                {target?.kind === 'chord' && mode === 'poly' && (
                  <PolyPips
                    targetClasses={heardState.target}
                    heardClasses={heardState.heard}
                  />
                )}
                <View style={[styles.listenPill, isRunning && styles.listenPillLive]}>
                  <ListeningBars live={isRunning} />
                  <Text
                    style={[styles.listenPillText, isRunning && styles.listenPillTextLive]}
                    numberOfLines={1}
                  >
                    {listenLabel}
                  </Text>
                </View>
              </View>
            </Animated.View>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Ionicons
                  name="flame-outline"
                  size={18}
                  color={streak > 0 ? Colors.warning : Colors.dark.muted}
                />
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statTile}>
                <Ionicons name="trending-up-outline" size={18} color={Colors.success} />
                <Text style={styles.statValue}>{bestStreak}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statTile}>
                <Ionicons name="analytics-outline" size={18} color={Colors.dark.muted} />
                <Text style={styles.statValue}>
                  {attempts === 0 ? '—' : `${scorePercent}%`}
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.dark.muted,
    marginTop: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  toggleCaption: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.dark.muted,
    marginBottom: 4,
    marginLeft: 4,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: Colors.success,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.muted,
  },
  toggleTextActive: {
    color: '#fff',
  },
  conveyorWrap: {
    marginTop: 18,
    height: 74,
    overflow: 'hidden',
    paddingLeft: 16,
    justifyContent: 'center',
  },
  hitZone: {
    position: 'absolute',
    left: 12,
    width: CHIP_W + 8,
    top: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.success,
    opacity: 0.6,
  },
  conveyor: {
    flexDirection: 'row',
    gap: CHIP_GAP,
  },
  chip: {
    width: CHIP_W,
    height: 58,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCurrent: {
    backgroundColor: '#232345',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  chipHit: {
    backgroundColor: 'rgba(76,175,80,0.25)',
  },
  chipMiss: {
    backgroundColor: 'rgba(244,67,54,0.18)',
  },
  chipText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark.muted,
  },
  chipTextBright: {
    color: Colors.dark.text,
  },
  chipSub: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 1,
  },
  chipCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stageLive: {
    justifyContent: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  introBox: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 360,
    alignSelf: 'stretch',
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.dark.muted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    textAlign: 'center',
  },
  startBtn: {
    backgroundColor: Colors.success,
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 44,
    ...CARD_SHADOW,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  finishBox: {
    width: '100%',
  },
  finishStatsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 4,
  },
  finishStatTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  finishStatValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
  },
  finishStatValuePass: {
    color: Colors.success,
  },
  finishStatDenom: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.muted,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  doneText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.dark.muted,
    textAlign: 'center',
  },
  targetBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    ...CARD_SHADOW,
  },
  targetBoxLive: {
    paddingVertical: 18,
    gap: 10,
  },
  targetBody: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardFooter: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 8,
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 12,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 16,
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.dark.muted,
  },
  targetEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.success,
  },
  countIn: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
    minWidth: 30,
    textAlign: 'center',
  },
  beatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 30,
  },
  beatPip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  beatPipDownbeat: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
  },
  beatPipActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  timingText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.muted,
  },
  timingGood: {
    color: Colors.success,
  },
  targetName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  strumCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
  },
  tabStrip: {
    width: 300,
    gap: 10,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 22,
  },
  tabLabel: {
    width: 16,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.muted,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.success,
  },
  tabLineWrap: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLine: {
    alignSelf: 'stretch',
    height: 2,
    borderRadius: 1,
    backgroundColor: '#2e2e55',
  },
  tabLineActive: {
    backgroundColor: 'rgba(76,175,80,0.5)',
  },
  tabFretBadge: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabFretText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  pipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.muted,
  },
  pip: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 5,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  pipHeard: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  pipText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark.muted,
  },
  pipTextHeard: {
    color: '#fff',
  },
  listenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 15,
  },
  listenPillLive: {
    backgroundColor: 'rgba(76,175,80,0.10)',
    borderColor: 'rgba(76,175,80,0.35)',
  },
  listenPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.muted,
    fontVariant: ['tabular-nums'],
  },
  listenPillTextLive: {
    color: '#a5d6a7',
  },
  eqWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 14,
  },
  eqBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.muted,
  },
  eqBarLive: {
    backgroundColor: Colors.success,
  },
  eqBarShort: { height: 7 },
  eqBarTall: { height: 13 },
  eqBarMid: { height: 9 },
});
