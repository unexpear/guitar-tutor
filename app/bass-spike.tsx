import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, CARD_SHADOW } from '../constants/Colors';
import { TunerEngine } from 'react-native-tuner-engine';
import type { PitchEvent, EngineStatus } from 'react-native-tuner-engine';

// ---------------------------------------------------------------------------
// Dedicated low-frequency diagnostic. The production tuner now has explicit
// instrument profiles; this screen remains useful because it exposes raw E1
// readings and octave failures without any app-side correction.
// ---------------------------------------------------------------------------
const BASS_SPIKE_CONFIG = {
  instrument: 'bass' as const,
  minFrequency: 40,
  maxFrequency: 1400,
  hpfCutoffHz: 30,
  quality: 'high-accuracy' as const,
  adaptiveFrameSize: true,
  confidenceThreshold: 0.75,
  noiseGateDb: -55,
  a4: 440,
} as const;

// What the engine actually applies: `quality` forces its own frame/overlap and
// disables adaptiveFrameSize (see TunerEngine.configure). Show the effective
// values so a reviewer never wonders whether the guitar path was tested.
const EFFECTIVE = {
  frameSize: 4096,
  overlapRatio: 0.75,
  adaptiveFrameSize: false,
  note:
    "quality 'high-accuracy' → frameSize 4096, overlap 0.75 and forces adaptiveFrameSize off",
} as const;

const TARGETS = [
  { label: 'E1', freq: 41.20344 },
  { label: 'F1', freq: 43.65353 },
  { label: 'G1', freq: 48.99943 },
  { label: 'A1', freq: 55.0 },
] as const;

const E1_FREQ = 41.20344;

type HistoryEntry = {
  t: string;
  seq: number;
  hasPitch: boolean;
  frequency: number;
  noteName: string;
  octave: number;
  cents: number;
  confidence: number;
  rmsDb: number;
  classification: 'E1_LOCK' | 'OCTAVE_UP' | 'NEAR_TARGET' | 'LOSS' | 'NOISE';
  targetLabel: string | null;
};

function classify(
  ev: PitchEvent | null,
  status: EngineStatus | null,
): { label: HistoryEntry['classification']; target: string | null } {
  if (!ev || !ev.hasPitch || !status?.hasPitch) return { label: 'LOSS', target: null };
  const f = ev.frequency;
  if (Math.abs(f - E1_FREQ) < 1.5) return { label: 'E1_LOCK', target: 'E1' };
  if (Math.abs(f - E1_FREQ * 2) < 2.5) return { label: 'OCTAVE_UP', target: 'E1×2 → E2' };
  for (const t of TARGETS) {
    if (Math.abs(f - t.freq) < 1.2) return { label: 'NEAR_TARGET', target: t.label };
  }
  return { label: 'NOISE', target: null };
}

function statusFor(hasPitch: boolean, cents: number, isRunning: boolean, approxE1: boolean) {
  if (!isRunning) return { text: 'STOPPED', color: Colors.dark.muted, bg: '#1e1e2e' };
  if (!hasPitch) return { text: 'LISTENING…', color: '#9ca3af', bg: '#1e1e2e' };
  if (approxE1 && Math.abs(cents) <= 5) return { text: 'IN TUNE', color: '#fff', bg: Colors.success };
  if (Math.abs(cents) <= 5) return { text: 'IN TUNE', color: '#fff', bg: Colors.success };
  return {
    text: cents < 0 ? 'FLAT' : 'SHARP',
    color: '#111',
    bg: Colors.warning,
  };
}

export default function BassSpikeScreen() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [latest, setLatest] = useState<PitchEvent | null>(null);
  const [raw, setRaw] = useState<EngineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seqRef = useRef(0);

  const stop = useCallback(async () => {
    try {
      unsubRef.current?.();
      unsubRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      await TunerEngine.stop();
    } catch {}
    setIsRunning(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const granted = await TunerEngine.requestPermission();
      if (!granted) throw new Error('Microphone permission denied — enable it in system settings');
      // Configure exactly the spike values. instrument is set separately via setInstrument.
      await TunerEngine.configure({
        minFrequency: BASS_SPIKE_CONFIG.minFrequency,
        maxFrequency: BASS_SPIKE_CONFIG.maxFrequency,
        hpfCutoffHz: BASS_SPIKE_CONFIG.hpfCutoffHz,
        quality: BASS_SPIKE_CONFIG.quality,
        adaptiveFrameSize: BASS_SPIKE_CONFIG.adaptiveFrameSize,
        confidenceThreshold: BASS_SPIKE_CONFIG.confidenceThreshold,
        noiseGateDb: BASS_SPIKE_CONFIG.noiseGateDb,
      });
      TunerEngine.setInstrument(BASS_SPIKE_CONFIG.instrument);
      TunerEngine.setA4(BASS_SPIKE_CONFIG.a4);

      unsubRef.current = TunerEngine.onPitch((ev: PitchEvent) => {
        seqRef.current += 1;
        setLatest(ev);
        // Pull raw status on each pitch for the "raw/native reading" row.
        try {
          const s = TunerEngine.getStatus() as EngineStatus;
          setRaw(s);
        } catch {}
        const cls = classify(ev, { hasPitch: ev.hasPitch } as EngineStatus);
        const entry: HistoryEntry = {
          t: new Date().toLocaleTimeString(),
          seq: seqRef.current,
          hasPitch: ev.hasPitch,
          frequency: ev.frequency,
          noteName: ev.noteName,
          octave: ev.octave,
          cents: ev.cents,
          confidence: ev.confidence,
          rmsDb: ev.rmsDb,
          classification: cls.label,
          targetLabel: cls.target,
        };
        setHistory((h) => [entry, ...h].slice(0, 20));
      });

      // Poll getStatus even when hasPitch is false so "LOSS" periods are visible.
      pollRef.current = setInterval(() => {
        try {
          const s = TunerEngine.getStatus() as EngineStatus;
          setRaw(s);
          // If we have no pitch, still push a LOSS entry every ~600ms so the
          // history distinguishes "silent room" from "unstable".
          if (!s.hasPitch) {
            const entry: HistoryEntry = {
              t: new Date().toLocaleTimeString(),
              seq: s.seq,
              hasPitch: false,
              frequency: 0,
              noteName: '--',
              octave: 0,
              cents: 0,
              confidence: s.confidence ?? 0,
              rmsDb: s.rmsDb ?? -120,
              classification: 'LOSS',
              targetLabel: null,
            };
            setHistory((h) => {
              const last = h[0];
              if (last && last.classification === 'LOSS' && last.seq === entry.seq) return h;
              return [entry, ...h].slice(0, 20);
            });
          }
        } catch {}
      }, 400);

      await TunerEngine.start();
      setIsRunning(true);
    } catch (e) {
      unsubRef.current?.();
      unsubRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
      setError(e instanceof Error ? e.message : String(e));
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      if (pollRef.current) clearInterval(pollRef.current);
      TunerEngine.stop().catch(() => {});
    };
  }, []);

  const hasPitch = !!(latest?.hasPitch && raw?.hasPitch !== false);
  const freq = hasPitch && latest ? latest.frequency : 0;
  const cents = hasPitch && latest ? Math.round(latest.cents) : 0;
  const noteLabel = hasPitch && latest ? `${latest.noteName}${latest.octave}` : '--';
  const confidence = latest?.confidence ?? 0;
  const rmsDb = latest?.rmsDb ?? -120;
  const approxE1 = hasPitch && Math.abs(freq - E1_FREQ) < 1.8;
  const st = statusFor(hasPitch, cents, isRunning, approxE1);

  // Gate highlight
  const gateColor = !isRunning
    ? Colors.dark.muted
    : !hasPitch
      ? '#6b7280'
      : approxE1
        ? Colors.success
        : '#f59e0b';

  if (!__DEV__) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: Colors.danger, fontWeight: '700', fontSize: 16, textAlign: 'center' }}>
          Bass spike harness is dev-only. Build with __DEV__ to use it.
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.primaryBtn, { marginTop: 20 }]}>
          <Text style={styles.primaryBtnText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Bass Spike · E1 Gate</Text>
          <Text style={styles.headerSub}>temporary · dev only</Text>
        </View>
        <View style={styles.devBadge}>
          <Text style={styles.devBadgeText}>DEV</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningTitle}>⚠ TEMPORARY SPIKE — NOT PRODUCTION TUNER</Text>
          <Text style={styles.warningBody}>
            This screen bypasses the production tuner and drives the singleton engine directly with
            bass values. It intentionally shows raw readings without the production tuner&apos;s stability
            and overtone correction. Returning to Tuner and tapping start applies the selected profile.
          </Text>
        </View>

        {/* Start / Stop */}
        <Pressable
          onPress={isRunning ? stop : start}
          style={[styles.primaryBtn, isRunning ? styles.stopBtn : styles.startBtn]}
          accessibilityLabel={isRunning ? 'Stop listening' : 'Start listening'}
        >
          <Text style={[styles.primaryBtnText, isRunning && { color: '#fff' }]}>
            {isRunning ? '■ Stop' : '● Start listening'}
          </Text>
        </Pressable>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Configuration display */}
        <View style={[styles.card, CARD_SHADOW]}>
          <Text style={styles.cardTitle}>Configuration (requested → effective)</Text>
          <View style={styles.kvGrid}>
            <Row k="instrument" v={BASS_SPIKE_CONFIG.instrument} />
            <Row k="minFrequency" v={`${BASS_SPIKE_CONFIG.minFrequency} Hz`} />
            <Row k="maxFrequency" v={`${BASS_SPIKE_CONFIG.maxFrequency} Hz`} />
            <Row k="hpfCutoffHz" v={`${BASS_SPIKE_CONFIG.hpfCutoffHz} Hz`} dim="(default 70 → 30 lets E1 through)" />
            <Row k="quality" v={BASS_SPIKE_CONFIG.quality} />
            <Row k="adaptiveFrameSize" v={String(BASS_SPIKE_CONFIG.adaptiveFrameSize)} dim="→ false (forced off by quality)" />
            <Row k="confidenceThreshold" v={String(BASS_SPIKE_CONFIG.confidenceThreshold)} />
            <Row k="noiseGateDb" v={`${BASS_SPIKE_CONFIG.noiseGateDb} dB`} />
            <Row k="a4" v={`${BASS_SPIKE_CONFIG.a4} Hz`} />
          </View>
          <View style={styles.effectiveBox}>
            <Text style={styles.effectiveTitle}>Effective engine (from quality preset)</Text>
            <Text style={styles.effectiveBody}>
              frameSize {EFFECTIVE.frameSize} · overlap {EFFECTIVE.overlapRatio} · adaptiveFrameSize{' '}
              {String(EFFECTIVE.adaptiveFrameSize)} — {EFFECTIVE.note}
            </Text>
          </View>
          <Text style={styles.hint}>If this table ever stops matching the constants at the top of bass-spike.tsx, you are not testing bass.</Text>
        </View>

        {/* Critical test — visually obvious */}
        <View style={[styles.card, CARD_SHADOW, { borderColor: gateColor, borderWidth: 1.5 }]}>
          <Text style={styles.cardTitle}>Gate test — hold open E (E1 ≈ 41.20 Hz)</Text>
          <View style={styles.gateGrid}>
            <GateCell label="TARGET" value="E1" sub="41.20 Hz" />
            <GateCell
              label="DETECTED"
              value={hasPitch ? `${freq.toFixed(2)} Hz` : '—'}
              sub={noteLabel}
              highlight={hasPitch}
            />
            <GateCell label="CENTS" value={hasPitch ? `${cents > 0 ? '+' : ''}${cents}` : '—'} sub="vs nearest chromatic" />
            <View style={[styles.gateCell, { backgroundColor: st.bg, borderColor: st.bg }]}>
              <Text style={[styles.gateLabel, { color: st.color === '#fff' ? '#fff' : '#111' }]}>STATUS</Text>
              <Text style={[styles.gateValue, { color: st.color }]}>{st.text}</Text>
              <Text style={[styles.gateSub, { color: st.color === '#fff' ? '#e0ffe0' : '#333' }]}>
                {approxE1 ? '≈ E1 ✓' : hasPitch ? 'not E1' : isRunning ? 'no pitch' : 'stopped'}
              </Text>
            </View>
          </View>

          <View style={styles.approxRow}>
            <View style={[styles.dot, { backgroundColor: gateColor }]} />
            <Text style={[styles.approxText, { color: gateColor }]}>
              {approxE1 ? '≈ E1 within 1.8 Hz — gate PASSED' : hasPitch ? `Δ ${(freq - E1_FREQ).toFixed(1)} Hz from E1 — not E1` : '—'}
            </Text>
          </View>

          {/* Confidence + quality row */}
          <View style={styles.metricsRow}>
            <Metric label="confidence" value={hasPitch ? confidence.toFixed(2) : '—'} />
            <Metric label="rms" value={hasPitch ? `${rmsDb.toFixed(1)} dB` : '—'} />
            <Metric label="engine" value={isRunning ? 'running' : 'stopped'} />
            <Metric label="seq" value={raw ? String(raw.seq) : '—'} />
          </View>

          {/* Raw / native reading */}
          <View style={styles.rawBox}>
            <Text style={styles.rawTitle}>Raw · native reading (getStatus + onPitch)</Text>
            <Text style={styles.monoSmall} selectable>
              {raw
                ? `hasPitch:${String(raw.hasPitch)}  freq:${(raw.frequency ?? 0).toFixed(2)}  note:${raw.noteName || '--'}${raw.octave ?? ''}  cents:${Math.round(raw.cents ?? 0)}  conf:${(raw.confidence ?? 0).toFixed(2)}  rms:${(raw.rmsDb ?? 0).toFixed(1)}  ready:${String(raw.engineReady)}`
                : '— (start to populate)'}
            </Text>
            <Text style={styles.monoSmall} selectable>
              onPitch: {latest ? `hasPitch:${String(latest.hasPitch)}  ${latest.frequency.toFixed(2)} Hz  ${latest.noteName}${latest.octave}  cents ${Math.round(latest.cents)}` : '—'}
            </Text>
          </View>
        </View>

        {/* Open-string targets */}
        <View style={[styles.card, CARD_SHADOW]}>
          <Text style={styles.cardTitle}>Open-string map & chromatic gate (bass standard: E1 A1 D2 G2)</Text>
          <View style={styles.targetTable}>
            {[
              { label: 'E1', freq: 41.20344, open: true },
              { label: 'F1', freq: 43.65353, open: false },
              { label: 'G1', freq: 48.99943, open: false },
              { label: 'A1', freq: 55.0, open: true },
              { label: 'D2', freq: 73.41619, open: true },
              { label: 'G2', freq: 97.99886, open: true },
            ].map((t) => {
              const delta = hasPitch ? freq - t.freq : null;
              const near = delta !== null && Math.abs(delta) < 1.4;
              return (
                <View key={t.label} style={[styles.targetRow, near && styles.targetRowNear]}>
                  <Text style={[styles.targetLabel, t.open && styles.targetLabelOpen]}>{t.label}</Text>
                  <Text style={styles.targetFreq}>{t.freq.toFixed(2)} Hz</Text>
                  <Text style={styles.targetDelta}>{delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} Hz`}</Text>
                  <View style={[styles.nearBadge, near && styles.nearBadgeOn]}>
                    <Text style={[styles.nearBadgeText, near && styles.nearBadgeTextOn]}>{near ? 'NEAR' : ''}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.hint}>Test order: E1 → F1 → G1 → A1 chromatic. The E1 row is the gate — the others confirm the floor holds above ~41 Hz. Open strings E1/A1/D2/G2 are the later feature map.</Text>
        </View>

        {/* History */}
        <View style={[styles.card, CARD_SHADOW]}>
          <View style={styles.historyHeader}>
            <Text style={styles.cardTitle}>History — last {history.length} readings</Text>
            <Pressable onPress={() => setHistory([])} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>Stable E1 detection = repeated E1_LOCK with |cents| small. Octave error = OCTAVE_UP (→ E2). Loss = LOSS.</Text>
          {history.length === 0 ? (
            <Text style={[styles.monoSmall, { color: Colors.dark.muted, marginTop: 8 }]}>No readings yet — start and play E1.</Text>
          ) : (
            <View style={{ marginTop: 8 }}>
              {history.map((h, i) => (
                <View key={`${h.seq}-${i}-${h.t}`} style={[styles.historyRow, i === 0 && styles.historyRowLatest]}>
                  <Text style={[styles.historyTime, i === 0 && { color: Colors.dark.text, fontWeight: '700' }]}>{h.t}</Text>
                  <View style={[styles.classBadge, badgeStyle(h.classification)]}>
                    <Text style={[styles.classBadgeText, badgeTextStyle(h.classification)]}>{h.classification}</Text>
                  </View>
                  <Text style={styles.historyMain} numberOfLines={1}>
                    {h.hasPitch ? `${h.frequency.toFixed(1)} Hz  ${h.noteName}${h.octave}  ${h.cents > 0 ? '+' : ''}${Math.round(h.cents)}¢` : '— no pitch'}
                  </Text>
                  <Text style={styles.historyConf}>{h.hasPitch ? h.confidence.toFixed(2) : '—'}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.legendRow}>
            <LegendDot color={Colors.success} label="E1_LOCK" />
            <LegendDot color={Colors.danger} label="OCTAVE_UP" />
            <LegendDot color={Colors.warning} label="NEAR_TARGET" />
            <LegendDot color={Colors.dark.muted} label="LOSS" />
            <LegendDot color="#6b7280" label="NOISE" />
          </View>
        </View>

        {/* Protocol */}
        <View style={[styles.card, CARD_SHADOW]}>
          <Text style={styles.cardTitle}>Protocol — read before playing</Text>
          <Text style={styles.bodyText}>
            1) Start listening. Hold open E (E1) cleanly, near the neck pickup, moderate attack. Watch DETECTED — it
            should lock near 41.2 Hz and show <Text style={{ fontWeight: '700' }}>≈ E1 ✓</Text> and STATUS IN TUNE without
            flickering to E2.
          </Text>
          <Text style={styles.bodyText}>
            2) Gate: stable E1 for several seconds, sensible cents (|cents| small), no repeated LOSS (0 Hz) and no
            octave jumps while the note sustains. The history should be green E1_LOCK, not red OCTAVE_UP.
          </Text>
          <Text style={styles.bodyText}>
            3) Then walk F1 ≈ 43.65 → G1 ≈ 49.00 → A1 ≈ 55.00 (one fret at a time on the E string). Each should
            show near its target in the table.
          </Text>
          <Text style={styles.bodyText}>
            4) If E1 never locks or keeps showing LOSS / OCTAVE_UP / noisy cents, the 40 Hz floor or HPF is wrong — stop
            and investigate native config, do not proceed to bass UI.
          </Text>
          <Text style={[styles.bodyText, { color: Colors.dark.muted, fontStyle: 'italic' }]}>
            No built-in 41 Hz tone is included: phone speakers roll off hard below ~100 Hz and cannot emit E1
            usefully — the output is mostly harmonics, so the detector sees E2 and the gate misleads. Use a real
            bass for the gate; a laptop/DAW sine through decent monitors or wired headphones held near the mic is the
            controlled secondary check. If a synthetic tone is wanted later it should be an explicit optional
            generator (not the speaker alone) labelled as harmonic-only.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Row({ k, v, dim }: { k: string; v: string; dim?: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvKey}>{k}</Text>
      <Text style={styles.kvVal}>
        {v} {dim ? <Text style={styles.kvDim}>{dim}</Text> : null}
      </Text>
    </View>
  );
}

function GateCell({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.gateCell, highlight && styles.gateCellHighlight]}>
      <Text style={styles.gateLabel}>{label}</Text>
      <Text style={[styles.gateValue, highlight && { color: Colors.success }]}>{value}</Text>
      <Text style={styles.gateSub}>{sub}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: Colors.dark.muted, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function badgeStyle(c: HistoryEntry['classification']) {
  switch (c) {
    case 'E1_LOCK':
      return { backgroundColor: 'rgba(76,175,80,0.18)', borderColor: Colors.success };
    case 'OCTAVE_UP':
      return { backgroundColor: 'rgba(244,67,54,0.18)', borderColor: Colors.danger };
    case 'NEAR_TARGET':
      return { backgroundColor: 'rgba(255,193,7,0.18)', borderColor: Colors.warning };
    case 'LOSS':
      return { backgroundColor: 'rgba(156,163,175,0.12)', borderColor: '#3a3a5c' };
    case 'NOISE':
      return { backgroundColor: 'rgba(107,114,128,0.12)', borderColor: '#3a3a5c' };
  }
}
function badgeTextStyle(c: HistoryEntry['classification']) {
  switch (c) {
    case 'E1_LOCK':
      return { color: Colors.success };
    case 'OCTAVE_UP':
      return { color: Colors.danger };
    case 'NEAR_TARGET':
      return { color: Colors.warning };
    case 'LOSS':
      return { color: Colors.dark.muted };
    case 'NOISE':
      return { color: '#9ca3af' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
    backgroundColor: '#0f0f23',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.dark.text },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark.text, letterSpacing: 0.5 },
  headerSub: { fontSize: 11, color: Colors.dark.muted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  devBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  devBadgeText: { fontSize: 11, fontWeight: '800', color: '#111', letterSpacing: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  warningBanner: {
    backgroundColor: 'rgba(255,193,7,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: { fontSize: 12, fontWeight: '800', color: Colors.warning, letterSpacing: 0.6, marginBottom: 6 },
  warningBody: { fontSize: 12, lineHeight: 16, color: Colors.dark.muted },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: Colors.dark.text },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  startBtn: { backgroundColor: Colors.success },
  stopBtn: { backgroundColor: Colors.danger },
  primaryBtnText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  errorBox: {
    backgroundColor: 'rgba(244,67,54,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.35)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: Colors.danger, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.dark.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  kvGrid: { gap: 6 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 2 },
  kvKey: { fontSize: 13, color: Colors.dark.muted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  kvVal: { fontSize: 13, fontWeight: '600', color: Colors.dark.text, textAlign: 'right', flexShrink: 1 },
  kvDim: { fontSize: 11, fontWeight: '400', color: Colors.dark.muted },
  effectiveBox: {
    marginTop: 10,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  effectiveTitle: { fontSize: 11, fontWeight: '700', color: Colors.dark.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  effectiveBody: { fontSize: 12, lineHeight: 16, color: Colors.dark.text },
  hint: { fontSize: 11, lineHeight: 15, color: Colors.dark.muted, marginTop: 8, fontStyle: 'italic' },
  gateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gateCell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  gateCellHighlight: { borderColor: 'rgba(76,175,80,0.45)', backgroundColor: 'rgba(76,175,80,0.08)' },
  gateLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: Colors.dark.muted, marginBottom: 4 },
  gateValue: { fontSize: 20, fontWeight: '800', color: Colors.dark.text, textAlign: 'center' },
  gateSub: { fontSize: 11, color: Colors.dark.muted, marginTop: 2, textAlign: 'center' },
  approxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  approxText: { fontSize: 12, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  metric: {
    flex: 1,
    minWidth: 72,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: Colors.dark.muted, textTransform: 'uppercase' },
  metricValue: { fontSize: 13, fontWeight: '700', color: Colors.dark.text, marginTop: 2 },
  rawBox: {
    marginTop: 12,
    backgroundColor: '#0a0a1a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e1e3a',
  },
  rawTitle: { fontSize: 11, fontWeight: '700', color: Colors.dark.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  monoSmall: { fontSize: 11, lineHeight: 15, color: '#cbd5e1', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  targetTable: { gap: 6, marginTop: 4 },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  targetRowNear: { borderColor: 'rgba(76,175,80,0.45)', backgroundColor: 'rgba(76,175,80,0.08)' },
  targetLabel: { fontSize: 13, fontWeight: '800', color: Colors.dark.muted, width: 32 },
  targetLabelOpen: { color: Colors.success },
  targetFreq: { fontSize: 13, color: Colors.dark.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', width: 88, textAlign: 'right' },
  targetDelta: { fontSize: 12, color: Colors.dark.muted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', width: 82, textAlign: 'right' },
  nearBadge: { width: 44, alignItems: 'center' },
  nearBadgeOn: { backgroundColor: Colors.success, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  nearBadgeText: { fontSize: 10, fontWeight: '700', color: 'transparent' },
  nearBadgeTextOn: { color: '#fff' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearBtn: { backgroundColor: Colors.dark.surfaceElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  clearBtnText: { fontSize: 12, fontWeight: '600', color: Colors.dark.muted },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  historyRowLatest: { backgroundColor: 'rgba(255,255,255,0.04)' },
  historyTime: { fontSize: 11, color: Colors.dark.muted, width: 64, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  classBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, minWidth: 86, alignItems: 'center' },
  classBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  historyMain: { flex: 1, fontSize: 12, color: Colors.dark.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  historyConf: { fontSize: 11, color: Colors.dark.muted, width: 32, textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  legendRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.dark.cardBorder },
  bodyText: { fontSize: 13, lineHeight: 18, color: Colors.dark.text, marginBottom: 8 },
});
