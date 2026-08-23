import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  SectionList,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useTuner } from '../../features/tuner/hooks/useTuner';
import { useGuitarSound } from '../../features/audio/hooks/useGuitarSound';
import {
  TUNING_PRESETS,
  TuningPreset,
} from '../../features/tuner/data/tunings';
import { Colors, CARD_SHADOW, centsToColor } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import HeadstockSvg from '../../features/tuner/components/HeadstockSvg';
import { useProgressStore } from '../../features/store/progressStore';
import { usePracticeTimer } from '../../features/practice/usePracticeTimer';
import { useMicReleaseOnLeave } from '../../features/audio/useMicReleaseOnLeave';
import { useUserPreferencesStore } from '../../features/store/userPreferencesStore';

const SECTIONS = [
  {
    title: 'Acoustic',
    data: TUNING_PRESETS.filter((p) => p.guitarType === 'acoustic'),
  },
  {
    title: 'Electric',
    data: TUNING_PRESETS.filter((p) => p.guitarType === 'electric'),
  },
];

const NEEDLE_TRACK_WIDTH = 288;
const GAUGE_TICKS = Array.from({ length: 21 }, (_, i) => i);

export default function TunerScreen() {
  const { width } = useWindowDimensions();
  const alternateTuning = useProgressStore((s) => s.alternateTuning);
  const setAlternateTuning = useProgressStore((s) => s.setAlternateTuning);
  const guitarType = useUserPreferencesStore((s) => s.guitarType);
  const [tuning, setTuning] = useState<TuningPreset>(TUNING_PRESETS[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [tunedStrings, setTunedStrings] = useState<Set<number>>(new Set());
  const pulseValue = useSharedValue(1);
  const needleX = useSharedValue(0);

  const tuner = useTuner(tuning);
  usePracticeTimer(tuner.isActive);
  useMicReleaseOnLeave(tuner.stopListening, tuner.isActive);
  const { playNote } = useGuitarSound();

  // Peg labels follow the selected tuning (e.g. Drop D shows D A D G B E).
  const stringLabels = tuning.strings.map((n, i) => {
    const name = n.replace(/\d/g, '');
    return i === tuning.strings.length - 1 ? name.toLowerCase() : name;
  });

  const hasPitch = tuner.isActive && tuner.note !== '--';

  // When the pitch is near a string, guide toward that string's target
  // (e.g. tuning down to Drop D shows "D" and how far you are from D2,
  // not the nearest chromatic note). Otherwise fall back to chromatic.
  const displayCents =
    hasPitch && tuner.targetCents !== null ? tuner.targetCents : tuner.cents;
  const displayNote = !hasPitch
    ? '–'
    : tuner.nearestTarget
    ? tuner.nearestTarget.replace(/\d/g, '')
    : tuner.note;

  const isTuned = hasPitch && tuner.stringIndex !== null && Math.abs(displayCents) <= 5;

  const centsColor = hasPitch ? centsToColor(displayCents) : Colors.dark.muted;
  const noteColor = isTuned ? Colors.success : Colors.dark.text;

  const centsDisplay = hasPitch
    ? displayCents > 0
      ? `+${displayCents}`
      : `${displayCents}`
    : '0';
  const centsLabel = !hasPitch
    ? tuner.isActive
      ? 'Listening…'
      : 'Ready'
    : Math.abs(displayCents) <= 5
    ? 'In Tune'
    : displayCents > 0
    ? 'Sharp'
    : 'Flat';
  const clampedCents = Math.max(-50, Math.min(50, displayCents));

  // Animate the needle instead of snapping per pitch event.
  useEffect(() => {
    needleX.value = withTiming(
      (clampedCents / 100) * NEEDLE_TRACK_WIDTH,
      { duration: 120, easing: Easing.out(Easing.quad) },
    );
  }, [clampedCents, needleX]);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: needleX.value }],
  }));

  // Mark a string as tuned once it holds "in tune" for a moment.
  useEffect(() => {
    if (!isTuned || tuner.stringIndex === null) return;
    const stringIndex = tuner.stringIndex;
    const timer = setTimeout(() => {
      setTunedStrings((prev) => {
        if (prev.has(stringIndex)) return prev;
        const next = new Set(prev);
        next.add(stringIndex);
        return next;
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [isTuned, tuner.stringIndex]);

  const startPulse = useCallback(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulseValue]);

  const stopPulse = useCallback(() => {
    cancelAnimation(pulseValue);
    pulseValue.value = withTiming(1, { duration: 200 });
  }, [pulseValue]);

  const handleToggleTuning = useCallback(() => {
    tuner.toggleListening();
  }, [tuner.toggleListening]);

  useEffect(() => {
    if (tuner.isActive) {
      startPulse();
    } else {
      stopPulse();
    }
  }, [tuner.isActive, startPulse, stopPulse]);

  const handleSelectTuning = useCallback(
    (preset: TuningPreset) => {
      setTuning(preset);
      setTunedStrings(new Set());
      setPickerVisible(false);
      // Remember it, so Settings and the next launch agree with what is on
      // screen here.
      setAlternateTuning(preset.name);
    },
    [setAlternateTuning],
  );

  // Adopt the saved tuning once the store rehydrates, and whenever it is
  // changed from Settings. Several presets share a name across guitar types
  // (Drop D exists for both), so prefer the one matching the player's guitar.
  useEffect(() => {
    if (!alternateTuning || alternateTuning === tuning.name) return;
    const matches = TUNING_PRESETS.filter((p) => p.name === alternateTuning);
    const preset = matches.find((p) => p.guitarType === guitarType) ?? matches[0];
    if (!preset) return;
    setTuning(preset);
    setTunedStrings(new Set());
  }, [alternateTuning, guitarType, tuning.name]);

  const prevActiveRef = React.useRef(false);
  useEffect(() => {
    if (tuner.isActive && !prevActiveRef.current) {
      setTunedStrings(new Set()); // fresh session
    }
    prevActiveRef.current = tuner.isActive;
  }, [tuner.isActive]);

  const handlePlayReference = useCallback(
    (note: string) => {
      playNote(note);
    },
    [playNote],
  );

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const circleSize = Math.min(width * 0.12, 48);

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <PressableScale
          onPress={() => setPickerVisible(true)}
          style={styles.tuningIndicator}
          accessibilityLabel={`Current tuning: ${tuning.name}. Tap to change tuning.`}
          accessibilityRole="button"
        >
          <Text style={styles.tuningLabel}>{tuning.name}</Text>
          <Text style={styles.tuningChevron}>v</Text>
        </PressableScale>
      </View>

      <View style={styles.stringsArea}>
        <View style={styles.stringColumn}>
          {stringLabels.slice(0, 3).map((label, i) => {
            const isHighlighted = tuner.stringIndex === i;
            return (
              <PressableScale
                key={`left-${i}`}
                onPress={() => handlePlayReference(tuning.strings[i])}
                style={[
                  styles.stringCircle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    backgroundColor: isHighlighted
                      ? Colors.success
                      : Colors.dark.surfaceElevated,
                  },
                  isHighlighted && CARD_SHADOW,
                ]}
                accessibilityLabel={`String ${i + 1}: ${label}${isHighlighted ? ', detected' : ''}${tunedStrings.has(i) ? ', in tune' : ''}. Tap to hear reference.`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.stringLabel,
                    {
                      color: isHighlighted
                        ? '#fff'
                        : tunedStrings.has(i)
                        ? Colors.success
                        : Colors.dark.muted,
                      fontSize: circleSize * 0.38,
                    },
                  ]}
                >
                  {label}
                </Text>
                {tunedStrings.has(i) && (
                  <View style={styles.tunedBadge}>
                    <Text style={styles.tunedBadgeText}>{'✓'}</Text>
                  </View>
                )}
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.headstockArea}>
          <HeadstockSvg
            guitarType={tuning.guitarType}
            highlightColor={Colors.success}
            highlightedPeg={tuner.stringIndex ?? undefined}
          />
        </View>

        <View style={styles.stringColumn}>
          {stringLabels.slice(3).map((label, iRel) => {
            const i = iRel + 3;
            const isHighlighted = tuner.stringIndex === i;
            return (
              <PressableScale
                key={`right-${i}`}
                onPress={() => handlePlayReference(tuning.strings[i])}
                style={[
                  styles.stringCircle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    backgroundColor: isHighlighted
                      ? Colors.success
                      : Colors.dark.surfaceElevated,
                  },
                  isHighlighted && CARD_SHADOW,
                ]}
                accessibilityLabel={`String ${i + 1}: ${label}${isHighlighted ? ', detected' : ''}${tunedStrings.has(i) ? ', in tune' : ''}. Tap to hear reference.`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.stringLabel,
                    {
                      color: isHighlighted
                        ? '#fff'
                        : tunedStrings.has(i)
                        ? Colors.success
                        : Colors.dark.muted,
                      fontSize: circleSize * 0.38,
                    },
                  ]}
                >
                  {label}
                </Text>
                {tunedStrings.has(i) && (
                  <View style={styles.tunedBadge}>
                    <Text style={styles.tunedBadgeText}>{'✓'}</Text>
                  </View>
                )}
              </PressableScale>
            );
          })}
        </View>
      </View>

      <View style={styles.centerDisplay}>
        <View
          style={[
            styles.noteCircle,
            {
              borderColor: hasPitch ? centsColor : Colors.dark.cardBorder,
              backgroundColor: isTuned
                ? 'rgba(76,175,80,0.12)'
                : Colors.dark.surface,
            },
          ]}
        >
          <Text
            style={[styles.noteText, { color: noteColor }]}
            accessibilityLabel={
              hasPitch
                ? `Detected note: ${displayNote}, ${centsLabel} by ${Math.abs(displayCents)} cents`
                : tuner.isActive
                ? 'Listening for a note'
                : 'Tuner inactive'
            }
          >
            {displayNote}
          </Text>
        </View>

        <View style={styles.gauge}>
          <View style={styles.tickRow}>
            {GAUGE_TICKS.map((i) => (
              <View
                key={i}
                style={[
                  styles.tick,
                  i % 5 === 0 && styles.tickMajor,
                  i === 10 && styles.tickCenter,
                ]}
              />
            ))}
          </View>
          <Animated.View
            style={[
              styles.gaugeNeedle,
              { backgroundColor: centsColor },
              needleStyle,
            ]}
          />
        </View>
        <View style={styles.gaugeScaleRow}>
          <Text style={styles.gaugeScaleText}>-50</Text>
          <Text style={styles.gaugeScaleText}>0</Text>
          <Text style={styles.gaugeScaleText}>+50</Text>
        </View>

        <View style={styles.centsRow}>
          <Text style={[styles.centsValue, { color: centsColor }]}>
            {centsDisplay}
          </Text>
          <Text style={styles.centsUnit}>cents</Text>
        </View>
        <Text style={[styles.centsLabel, { color: centsColor }]}>
          {centsLabel}
        </Text>
        <Text style={styles.freqText}>
          {hasPitch ? `${tuner.frequency.toFixed(1)} Hz` : ' '}
        </Text>
      </View>

      <View style={styles.bottomArea}>
        {tuner.error && (
          <Text style={styles.tunerError} accessibilityRole="alert">
            Microphone unavailable: {tuner.error.message}. Check the app&apos;s
            mic permission in your device settings, then try again.
          </Text>
        )}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <PressableScale
            onPress={handleToggleTuning}
            style={[
              styles.tuneButton,
              {
                backgroundColor: tuner.isActive
                  ? Colors.dark.surfaceElevated
                  : Colors.success,
              },
            ]}
            accessibilityLabel={
              tuner.isActive ? 'Stop tuning' : 'Tap to start tuning'
            }
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.tuneButtonText,
                { color: tuner.isActive ? Colors.dark.text : '#fff' },
              ]}
            >
              {tuner.isActive ? 'Stop' : tuner.error ? 'Try Again' : 'Tap to Tune'}
            </Text>
          </PressableScale>
        </Animated.View>
      </View>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerVisible(false)}
          accessibilityLabel="Close tuning picker"
        >
          <Pressable
            style={styles.bottomSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Tuning</Text>

            <SectionList
              sections={SECTIONS}
              keyExtractor={(item) => `${item.guitarType}-${item.name}`}
              stickySectionHeadersEnabled
              renderSectionHeader={({ section }) => (
                <Text style={styles.sectionHeader}>{section.title}</Text>
              )}
              renderItem={({ item }) => {
                const isSelected =
                  item.name === tuning.name &&
                  item.guitarType === tuning.guitarType;
                return (
                  <PressableScale
                    onPress={() => handleSelectTuning(item)}
                    style={[
                      styles.presetRow,
                      isSelected && styles.presetRowSelected,
                    ]}
                    accessibilityLabel={`${item.name} tuning for ${item.guitarType} guitar${isSelected ? ', currently selected' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.presetInfo}>
                      <Text
                        style={[
                          styles.presetName,
                          isSelected && styles.presetNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.presetStrings}>
                        {item.strings.join(' - ')}
                      </Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </PressableScale>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  topArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  tuningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tuningLabel: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '600',
  },
  tuningChevron: {
    color: Colors.dark.muted,
    fontSize: 12,
  },
  stringsArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  stringColumn: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flex: 0,
  },
  headstockArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  stringCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  stringLabel: {
    fontWeight: '700',
  },
  centerDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  noteCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  noteText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gauge: {
    width: NEEDLE_TRACK_WIDTH,
    height: 44,
    justifyContent: 'center',
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  tick: {
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  tickMajor: {
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  tickCenter: {
    width: 3,
    height: 32,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  gaugeNeedle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    marginLeft: -2,
    width: 4,
    borderRadius: 2,
    ...CARD_SHADOW,
  },
  gaugeScaleRow: {
    width: NEEDLE_TRACK_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  gaugeScaleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.muted,
    fontVariant: ['tabular-nums'],
  },
  centsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
    gap: 6,
  },
  centsValue: {
    fontSize: 38,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  centsUnit: {
    fontSize: 14,
    color: Colors.dark.muted,
    fontWeight: '500',
  },
  centsLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  freqText: {
    fontSize: 12,
    color: Colors.dark.muted,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
    minHeight: 14,
  },
  tunedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tunedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  bottomArea: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 4,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  tunerError: {
    marginHorizontal: 24,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.danger,
    textAlign: 'center',
  },
  tuneButton: {
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 26,
    minWidth: 176,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  tuneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.dark.muted,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionHeader: {
    color: Colors.dark.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    backgroundColor: '#1a1a2e',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.cardBorder,
  },
  presetRowSelected: {
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  presetInfo: {
    flex: 1,
    gap: 2,
  },
  presetName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  presetNameSelected: {
    color: Colors.success,
  },
  presetStrings: {
    color: Colors.dark.muted,
    fontSize: 13,
    fontWeight: '400',
  },
  checkmark: {
    color: Colors.success,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
});
