import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, GestureResponderEvent } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import PressableScale from '../../components/PressableScale';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '../../constants/Layout';
import { Colors } from '../../constants/Colors';
import { useSettingsStore } from '../../features/store/settingsStore';
import { createBeatClock, BeatClock } from '../../features/timing/beatClock';
import { usePracticeTimer } from '../../features/practice/usePracticeTimer';
import { recordedChordSample } from '../../features/audio/data/chordAudioAssets';
import { referenceSample, sampleForNote } from '../../features/audio/data/audioAssets';
import { createJamBand, type JamBand } from '../../features/jams/jamBand';
import { JAM_HAT, JAM_KICK, JAM_SNARE } from '../../features/jams/jamDrumAssets';
import { jamBeatEvent } from '../../features/jams/jamPattern';
import { JAM_TRACKS, type JamTrack } from '../../features/jams/jams';

type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8';

const TIME_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '6/8'];

const TIME_SIGNATURE_MAP: Record<TimeSignature, number> = {
  '2/4': 2,
  '3/4': 3,
  '4/4': 4,
  '6/8': 6,
};

const MIN_BPM = 40;
const MAX_BPM = 200;

const ACCENT_CLICK = require('../../assets/audio/click-accent.wav');
const REGULAR_CLICK = require('../../assets/audio/click.wav');

/** One beat indicator. Owns its own animation hooks so the number of hooks
 *  per component stays constant regardless of the time signature. */
function BeatDot({
  index,
  isFirstBeat,
  isActive,
}: {
  index: number;
  isFirstBeat: boolean;
  isActive: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withTiming(isActive ? 1.4 : 1, {
      duration: 100,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(isActive ? 1 : 0.4, { duration: 100 });
  }, [isActive, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.beatDot,
        isFirstBeat ? styles.beatDotFirst : null,
        isActive && isFirstBeat ? styles.beatDotFirstActive : null,
        isActive && !isFirstBeat ? styles.beatDotActive : null,
        animatedStyle,
      ]}
      accessibilityLabel={`Beat ${index + 1}${isFirstBeat ? ' (downbeat)' : ''}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        style={[
          styles.beatDotLabel,
          isFirstBeat && styles.beatDotLabelFirst,
          isActive && styles.beatDotLabelActive,
        ]}
      >
        {index + 1}
      </Text>
    </Animated.View>
  );
}

export default function MetronomeScreen() {
  const insets = useSafeAreaInsets();
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  usePracticeTimer(isPlaying);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const [jamId, setJamId] = useState<string | null>(null);
  const [jamBar, setJamBar] = useState(0);
  const jam = JAM_TRACKS.find((item) => item.id === jamId) ?? null;
  const beatCount = TIME_SIGNATURE_MAP[timeSignature];

  // Refs so the running timer always sees current values without restarting.
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const beatCountRef = useRef(beatCount);
  beatCountRef.current = beatCount;
  const clockRef = useRef<BeatClock | null>(null);
  const isPlayingRef = useRef(false);
  const jamRef = useRef<JamTrack | null>(null);
  jamRef.current = jam;
  const jamBarRef = useRef(0);
  const jamBandRef = useRef<JamBand | null>(null);

  const accentPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const clickPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    accentPlayerRef.current = createAudioPlayer(ACCENT_CLICK);
    clickPlayerRef.current = createAudioPlayer(REGULAR_CLICK);
    jamBandRef.current = createJamBand({
      createPlayer: (asset) => createAudioPlayer(asset),
      getVolume: () => useSettingsStore.getState().sampleVolume,
      soundsEnabled: () => useSettingsStore.getState().soundsEnabled,
      kickAsset: JAM_KICK,
      snareAsset: JAM_SNARE,
      hatAsset: JAM_HAT,
      resolveNote: (note) =>
        recordedChordSample(note) ??
        referenceSample(note) ??
        (sampleForNote(note) ? { asset: sampleForNote(note)!, rate: 1 } : null),
    });
    return () => {
      isPlayingRef.current = false;
      clockRef.current?.stop();
      jamBandRef.current?.stop();
      jamBandRef.current = null;
      accentPlayerRef.current?.release();
      clickPlayerRef.current?.release();
      accentPlayerRef.current = null;
      clickPlayerRef.current = null;
    };
  }, []);

  const playClick = useCallback((beat: number) => {
    const { soundsEnabled, sampleVolume } = useSettingsStore.getState();
    if (!soundsEnabled) return;
    const player = beat === 0 ? accentPlayerRef.current : clickPlayerRef.current;
    if (!player) return;
    try {
      player.volume = sampleVolume / 100;
      player.seekTo(0);
      player.play();
    } catch {}
  }, []);

  const startMetronome = useCallback(() => {
    clockRef.current?.stop();
    jamBandRef.current?.stop();
    isPlayingRef.current = true;
    setIsPlaying(true);

    // Shared drift-corrected clock: resyncs after a stall instead of firing
    // the missed beats as a burst of clicks. A selected jam replaces the
    // click with drums, bass, and guitar that can overlap.
    jamBarRef.current = 0;
    setJamBar(0);
    clockRef.current = createBeatClock({
      getBpm: () => bpmRef.current,
      getBeatsPerBar: () => beatCountRef.current,
      onBeat: (beatInBar) => {
        const current = jamRef.current;
        if (current) {
          const event = jamBeatEvent(current, jamBarRef.current, beatInBar);
          jamBandRef.current?.playBeat(event);
          if (beatInBar === 0) {
            setJamBar(jamBarRef.current % current.bars.length);
          }
          if (beatInBar === beatCountRef.current - 1) {
            jamBarRef.current += 1;
          }
        } else {
          playClick(beatInBar);
        }
        setActiveBeat(beatInBar);
      },
    });
    clockRef.current.start();
  }, [playClick]);

  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false;
    clockRef.current?.stop();
    jamBandRef.current?.stop();
    setIsPlaying(false);
    setActiveBeat(null);
    accentPlayerRef.current?.pause();
    clickPlayerRef.current?.pause();
  }, []);

  useFocusEffect(useCallback(() => () => stopMetronome(), [stopMetronome]));

  const toggleMetronome = useCallback(() => {
    if (isPlayingRef.current) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [startMetronome, stopMetronome]);

  const handleTimeSignatureChange = useCallback(
    (sig: TimeSignature) => {
      if (isPlayingRef.current) stopMetronome();
      if (jamRef.current && sig !== '4/4') setJamId(null);
      setTimeSignature(sig);
    },
    [stopMetronome],
  );

  const handleJamChange = useCallback(
    (id: string) => {
      if (isPlayingRef.current) stopMetronome();
      if (jamId === id) {
        setJamId(null);
        return;
      }
      const next = JAM_TRACKS.find((item) => item.id === id);
      if (!next) return;
      setTimeSignature('4/4');
      setBpm(next.bpm);
      jamBarRef.current = 0;
      setJamBar(0);
      setJamId(id);
    },
    [jamId, stopMetronome],
  );

  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(newBpm))));
    // The running scheduler reads bpmRef on its next tick - no restart needed.
  }, []);

  const tapTempoRef = useRef<number[]>([]);
  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    const taps = tapTempoRef.current;
    // Reset the sequence if the last tap was too long ago.
    if (taps.length > 0 && now - taps[taps.length - 1] > 2500) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      handleBpmChange(60000 / avgInterval);
    }
  }, [handleBpmChange]);

  // --- Interactive BPM slider ---
  const trackWidthRef = useRef(1);
  const bpmFromTouch = useCallback(
    (evt: GestureResponderEvent) => {
      const x = evt.nativeEvent.locationX;
      const fraction = Math.max(0, Math.min(1, x / trackWidthRef.current));
      handleBpmChange(MIN_BPM + fraction * (MAX_BPM - MIN_BPM));
    },
    [handleBpmChange],
  );

  const sliderPercentage = ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100;
  const handleTempoAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (event.nativeEvent.actionName === 'increment') handleBpmChange(bpm + 1);
      if (event.nativeEvent.actionName === 'decrement') handleBpmChange(bpm - 1);
    },
    [bpm, handleBpmChange],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Metronome</Text>
      </View>

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.beatsContainer} accessibilityRole="none">
          {Array.from({ length: beatCount }).map((_, index) => (
            <BeatDot
              key={`${timeSignature}-${index}`}
              index={index}
              isFirstBeat={index === 0}
              isActive={isPlaying && activeBeat === index}
            />
          ))}
        </View>

        <Text style={styles.beatHint}>{timeSignature === '6/8' ? 'Six eighth-note clicks per bar. Beat 1 is accented.' : 'One click per beat. Beat 1 is accented.'}</Text>

        <View style={styles.bpmDisplay}>
          <Text style={styles.bpmValue}>{bpm}</Text>
          <Text style={styles.bpmLabel}>BPM</Text>
        </View>

        <View style={styles.sliderSection}>
          <PressableScale
            onPress={() => handleBpmChange(bpm - 1)}
            style={styles.bpmStepButton}
            accessibilityRole="button"
            accessibilityLabel="Decrease tempo by one"
          >
            <Text style={styles.bpmStepText}>−</Text>
          </PressableScale>
          <View
            style={styles.sliderTouchArea}
            onLayout={(e) => {
              trackWidthRef.current = Math.max(1, e.nativeEvent.layout.width);
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={bpmFromTouch}
            onResponderMove={bpmFromTouch}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Tempo slider"
            accessibilityValue={{ min: MIN_BPM, max: MAX_BPM, now: bpm, text: `${bpm} BPM` }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={handleTempoAccessibilityAction}
          >
            <View style={styles.sliderTrack} pointerEvents="none">
              <View style={[styles.sliderFill, { width: `${sliderPercentage}%` }]} />
              <View style={[styles.sliderThumb, { left: `${sliderPercentage}%` }]} />
            </View>
          </View>
          <PressableScale
            onPress={() => handleBpmChange(bpm + 1)}
            style={styles.bpmStepButton}
            accessibilityRole="button"
            accessibilityLabel="Increase tempo by one"
          >
            <Text style={styles.bpmStepText}>+</Text>
          </PressableScale>
        </View>
        <View style={styles.sliderRangeRow}>
          <Text style={styles.sliderMin}>{MIN_BPM}</Text>
          <Text style={styles.sliderMax}>{MAX_BPM}</Text>
        </View>

        <View style={styles.controlsRow}>
          <PressableScale
            style={styles.tapTempoButton}
            onPress={handleTapTempo}
            accessibilityRole="button"
            accessibilityLabel="Tap tempo"
          >
            <Text style={styles.tapTempoText}>Tap tempo</Text>
          </PressableScale>

          <PressableScale
            style={[
              styles.playStopButton,
              isPlaying ? styles.stopButton : styles.playButton,
            ]}
            onPress={toggleMetronome}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Stop metronome' : 'Start metronome'}
          >
            <Text style={{ fontSize: 20, color: '#071408', fontWeight: '700' }}>
              {isPlaying ? 'Stop' : 'Play'}
            </Text>
          </PressableScale>
        </View>

        <View style={styles.timeSigContainer}>
          <Text style={styles.sectionLabel}>Time Signature</Text>
          <View style={styles.timeSigRow}>
            {TIME_SIGNATURES.map((sig) => (
              <PressableScale
                key={sig}
                style={[
                  styles.timeSigButton,
                  timeSignature === sig && styles.timeSigButtonActive,
                ]}
                onPress={() => handleTimeSignatureChange(sig)}
                accessibilityRole="button"
                accessibilityLabel={`Time signature ${sig}`}
                accessibilityState={{ selected: timeSignature === sig }}
              >
                <Text
                  style={[
                    styles.timeSigButtonText,
                    timeSignature === sig && styles.timeSigButtonTextActive,
                  ]}
                >
                  {sig}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>

        <View style={styles.jamSection}>
          <Text style={styles.sectionLabel}>Jam tracks</Text>
          <Text style={styles.jamHelp}>Original drum, bass, and chord grooves with the notes that fit. No songs.</Text>
          <View style={styles.jamRow}>
            {JAM_TRACKS.map((item) => (
              <PressableScale
                key={item.id}
                style={[styles.jamChip, jamId === item.id && styles.jamChipActive]}
                onPress={() => handleJamChange(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} jam, ${item.bpm} BPM`}
                accessibilityState={{ selected: jamId === item.id }}
              >
                <Text style={[styles.jamChipText, jamId === item.id && styles.jamChipTextActive]}>{item.name}</Text>
              </PressableScale>
            ))}
          </View>
          {jam && (
            <View style={styles.jamCard}>
              <Text style={styles.jamChanges}>
                {jam.bars.map((name, index) => (index === jamBar && isPlaying ? `› ${name}` : name)).join('   ')}
              </Text>
              <Text style={styles.jamScale}>Play {jam.scale.join('  ')}</Text>
              <Text style={styles.jamHelp}>{jam.hint} Kick and chord on 1, snare on 3, hats and bass through the bar. Tap the jam again to clear it.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    width: '100%', maxWidth: Layout.readingWidth, alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bodyScroll: {
    flex: 1,
  },
  beatHint: { color: Colors.dark.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  body: {
    width: '100%', maxWidth: Layout.readingWidth, alignSelf: 'center',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 20,
  },
  beatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  beatDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beatDotFirst: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  beatDotActive: {
    backgroundColor: Colors.success,
  },
  beatDotFirstActive: {
    backgroundColor: '#FF6B6B',
  },
  beatDotLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.muted,
  },
  beatDotLabelFirst: {
    fontSize: 16,
  },
  beatDotLabelActive: {
    color: '#FFFFFF',
  },
  bpmDisplay: {
    alignItems: 'center',
  },
  bpmValue: {
    fontSize: 80,
    fontWeight: '200',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  bpmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.muted,
    letterSpacing: 3,
    marginTop: -4,
  },
  sliderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  sliderRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 44,
    marginTop: -20,
  },
  sliderMin: {
    fontSize: 12,
    color: Colors.dark.muted,
    fontWeight: '600',
  },
  sliderMax: {
    fontSize: 12,
    color: Colors.dark.muted,
    fontWeight: '600',
  },
  bpmStepButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bpmStepText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sliderTouchArea: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#1a1a3e',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginLeft: -12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  tapTempoButton: {
    minWidth: 110,
    minHeight: 64,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a3e',
    borderWidth: 2,
    borderColor: '#2a2a5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapTempoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  playStopButton: {
    minWidth: 88,
    minHeight: 64,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  timeSigContainer: {
    alignItems: 'center',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  timeSigRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 10,
  },
  timeSigButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#1a1a3e',
  },
  timeSigButtonActive: {
    backgroundColor: Colors.success,
  },
  timeSigButtonTextActive: {
    color: '#071408',
  },
  timeSigButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.muted,
  },
  jamSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  jamHelp: {
    color: Colors.dark.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  jamRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  jamChip: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jamChipActive: {
    backgroundColor: Colors.success,
  },
  jamChipText: {
    color: Colors.dark.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  jamChipTextActive: {
    color: '#071408',
  },
  jamCard: {
    width: '100%',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#1a1a3e',
  },
  jamChanges: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  jamScale: {
    color: '#FFD166',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
