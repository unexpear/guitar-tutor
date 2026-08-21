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

const NEEDLE_TRACK_WIDTH = 120;

export default function TunerScreen() {
  const { width, height } = useWindowDimensions();
  const [tuning, setTuning] = useState<TuningPreset>(TUNING_PRESETS[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [tunedStrings, setTunedStrings] = useState<Set<number>>(new Set());
  const pulseValue = useSharedValue(1);
  const needleX = useSharedValue(0);

  const tuner = useTuner(tuning);
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
      : 'Tap to Tune'
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
    },
    [],
  );

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
  const noteFontSize = Math.min(width * 0.28, 120);
  const centsFontSize = Math.min(width * 0.06, 28);
  const headstockHeight = Math.min(height * 0.28, 280);
  const headstockWidth = headstockHeight * (200 / 320);

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
        <Text
          style={[styles.noteText, { color: noteColor, fontSize: noteFontSize }]}
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

        <View style={styles.centsRow}>
          <View style={styles.centsIndicatorContainer}>
            <View style={styles.centsTrack}>
              <View style={styles.centsCenterTick} />
              <Animated.View
                style={[
                  styles.centsNeedle,
                  { backgroundColor: centsColor },
                  needleStyle,
                ]}
              />
            </View>
          </View>
          <Text style={[styles.centsValue, { color: centsColor, fontSize: centsFontSize }]}>
            {centsDisplay}
          </Text>
          <Text style={[styles.centsUnit, { fontSize: centsFontSize * 0.6 }]}>
            cents
          </Text>
        </View>
        <Text style={[styles.centsLabel, { color: centsColor }]}>
          {centsLabel}
        </Text>
        <Text style={styles.freqText}>
          {hasPitch ? `${tuner.frequency.toFixed(1)} Hz` : ' '}
        </Text>
      </View>

      <View style={styles.bottomArea}>
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
              {tuner.isActive ? 'Stop' : 'Tap to Tune'}
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  noteText: {
    fontWeight: '800',
    letterSpacing: 2,
  },
  centsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  centsIndicatorContainer: {
    width: 120,
    height: 4,
    overflow: 'hidden',
    borderRadius: 2,
  },
  centsTrack: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 2,
    position: 'relative',
  },
  centsNeedle: {
    position: 'absolute',
    top: -1,
    left: '50%',
    marginLeft: -1.5,
    width: 3,
    height: 6,
    borderRadius: 1.5,
  },
  centsCenterTick: {
    position: 'absolute',
    left: '50%',
    top: -3,
    marginLeft: -0.5,
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  centsValue: {
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  centsUnit: {
    color: Colors.dark.muted,
    fontWeight: '500',
  },
  centsLabel: {
    fontSize: 13,
    fontWeight: '600',
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
    paddingBottom: 24,
    paddingTop: 8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  tuneButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    minWidth: 220,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  tuneButtonText: {
    fontSize: 18,
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
