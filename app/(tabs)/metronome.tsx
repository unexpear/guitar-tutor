import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, GestureResponderEvent } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import PressableScale from '../../components/PressableScale';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { useSettingsStore } from '../../features/store/settingsStore';
import { createBeatClock, BeatClock } from '../../features/timing/beatClock';
import { usePracticeTimer } from '../../features/practice/usePracticeTimer';

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
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  usePracticeTimer(isPlaying);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const beatCount = TIME_SIGNATURE_MAP[timeSignature];

  // Refs so the running timer always sees current values without restarting.
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const beatCountRef = useRef(beatCount);
  beatCountRef.current = beatCount;
  const clockRef = useRef<BeatClock | null>(null);
  const isPlayingRef = useRef(false);

  const accentPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const clickPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    accentPlayerRef.current = createAudioPlayer(ACCENT_CLICK);
    clickPlayerRef.current = createAudioPlayer(REGULAR_CLICK);
    return () => {
      isPlayingRef.current = false;
      clockRef.current?.stop();
      accentPlayerRef.current?.release();
      clickPlayerRef.current?.release();
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
    isPlayingRef.current = true;
    setIsPlaying(true);

    // Shared drift-corrected clock: resyncs after a stall instead of firing
    // the missed beats as a burst of clicks.
    clockRef.current = createBeatClock({
      getBpm: () => bpmRef.current,
      getBeatsPerBar: () => beatCountRef.current,
      onBeat: (beatInBar) => {
        playClick(beatInBar);
        setActiveBeat(beatInBar);
      },
    });
    clockRef.current.start();
  }, [playClick]);

  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false;
    clockRef.current?.stop();
    setIsPlaying(false);
    setActiveBeat(null);
  }, []);

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
      setTimeSignature(sig);
    },
    [stopMetronome],
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Metronome</Text>
      </View>

      <View style={styles.body}>
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
            <Text style={styles.tapTempoText}>TAP</Text>
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
            <Text style={{ fontSize: 32, color: '#FFFFFF' }}>
              {isPlaying ? '⏹' : '▶️'}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
    gap: 28,
  },
  beatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    height: 40,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tapTempoButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
    flexDirection: 'row',
    gap: 10,
  },
  timeSigButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a3e',
  },
  timeSigButtonActive: {
    backgroundColor: Colors.success,
  },
  timeSigButtonTextActive: {
    color: '#FFFFFF',
  },
  timeSigButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.muted,
  },
});
