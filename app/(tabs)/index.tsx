import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
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
  findTuningPreset,
  tuningTargetLabel,
  TUNING_PRESETS,
  TuningPreset,
} from '../../features/tuner/data/tunings';
import {
  INSTRUMENT_PROFILES,
  instrumentProfile,
} from '../../features/tuner/data/instrumentProfiles';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import HeadstockSvg from '../../features/tuner/components/HeadstockSvg';
import { TuneVerdict } from '../../features/tuner/pitch';
import { useProgressStore } from '../../features/store/progressStore';
import { usePracticeTimer } from '../../features/practice/usePracticeTimer';
import { useMicReleaseOnLeave } from '../../features/audio/useMicReleaseOnLeave';
import { useUserPreferencesStore } from '../../features/store/userPreferencesStore';

const SECTIONS = INSTRUMENT_PROFILES.map((profile) => ({
  title: profile.name,
  data: TUNING_PRESETS.filter((preset) => preset.instrumentId === profile.id),
})).filter((section) => section.data.length > 0);

const NEEDLE_TRACK_WIDTH = 288;
const GAUGE_TICKS = Array.from({ length: 21 }, (_, i) => i);

const VERDICT_COLORS: Record<TuneVerdict, string> = {
  'in-tune': Colors.success,
  close: Colors.warning,
  off: Colors.danger,
};

/**
 * One string button. Tapping picks the string to tune; while it is the one
 * being aimed at, it carries the verdict colour so you can watch it go green
 * without looking away from the fretboard.
 */
function StringChip({
  index,
  label,
  note,
  positionLabel,
  size,
  selected,
  aimed,
  verdict,
  tuned,
  onPress,
}: {
  index: number;
  label: string;
  note: string;
  positionLabel: string;
  size: number;
  selected: boolean;
  aimed: boolean;
  verdict: TuneVerdict | null;
  tuned: boolean;
  onPress: (index: number, note: string) => void;
}) {
  const live = aimed && verdict ? VERDICT_COLORS[verdict] : null;
  const background = live ?? (selected ? Colors.dark.surfaceElevated : Colors.dark.surfaceElevated);
  const border = live ?? (selected ? Colors.dark.text : 'transparent');
  const labelColor = live ? '#0b1020' : tuned ? Colors.success : Colors.dark.muted;

  return (
    <PressableScale
      onPress={() => onPress(index, note)}
      style={[
        styles.stringCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          borderWidth: selected || live ? 2.5 : 0,
          borderColor: border,
        },
        (selected || !!live) && CARD_SHADOW,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${positionLabel}, ${label}${
        selected ? ', selected for tuning' : ''
      }${
        live
          ? verdict === 'in-tune'
            ? ', in tune'
            : verdict === 'close'
            ? ', nearly there'
            : ', out of tune'
          : ''
      }${tuned ? ', tuned this session' : ''}. Tap to tune this string.`}
    >
      <Text
        style={[
          styles.stringLabel,
          { color: labelColor, fontSize: size * 0.38 },
        ]}
      >
        {label}
      </Text>
      {tuned && !live && (
        <View style={styles.tunedBadge}>
          <Text style={styles.tunedBadgeText}>{'✓'}</Text>
        </View>
      )}
    </PressableScale>
  );
}

export default function TunerScreen() {
  const { width } = useWindowDimensions();
  const alternateTuning = useProgressStore((s) => s.alternateTuning);
  const setAlternateTuning = useProgressStore((s) => s.setAlternateTuning);
  const guitarType = useUserPreferencesStore((s) => s.guitarType);
  const [tuning, setTuning] = useState<TuningPreset>(
    () => findTuningPreset(alternateTuning, guitarType) ?? TUNING_PRESETS[0],
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [tunedStrings, setTunedStrings] = useState<Set<number>>(new Set());
  /** The string the user picked, or null to let the tuner guess. */
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const pulseValue = useSharedValue(1);
  const needleX = useSharedValue(0);

  const tuner = useTuner(tuning, selectedString);
  usePracticeTimer(tuner.isActive);
  useMicReleaseOnLeave(tuner.stopListening, tuner.isActive);
  const { playNote } = useGuitarSound();
  const profile = instrumentProfile(tuning.instrumentId);

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

  const isTuned = hasPitch && tuner.verdict === 'in-tune';

  // One verdict drives every colour on this screen. Its green window comes
  // from Settings; amber remains the near zone and red begins at ten cents.
  const centsColor =
    hasPitch && tuner.verdict ? VERDICT_COLORS[tuner.verdict] : Colors.dark.muted;
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
    : tuner.verdict === 'in-tune'
    ? 'In Tune'
    : displayCents > 0
    ? 'Tune Down ↓'
    : 'Tune Up ↑';
  const signalHint =
    tuner.harmonicRatio !== 1
      ? tuner.harmonicRatio > 1
        ? `Overtone corrected ×${tuner.harmonicRatio} · mute the other strings`
        : 'Octave error corrected · pluck the selected string again'
      : tuner.signal === 'noisy'
      ? 'Background sound is high · move closer and mute every other string'
      : tuner.signal === 'unstable'
      ? 'Let one string ring clearly · avoid touching the microphone'
      : tuner.signal === 'quiet'
      ? 'Play one string clearly near the microphone'
      : '';
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
      if (tuner.isActive) void tuner.stopListening();
      setTuning(preset);
      setTunedStrings(new Set());
      setSelectedString(null);
      setPickerVisible(false);
      // Remember it, so Settings and the next launch agree with what is on
      // screen here.
      setAlternateTuning(preset.id);
    },
    [setAlternateTuning, tuner.isActive, tuner.stopListening],
  );

  // Adopt the saved tuning once the store rehydrates, and whenever it is
  // changed from Settings. Several presets share a name across guitar types
  // (Drop D exists for both), so prefer the one matching the player's guitar.
  useEffect(() => {
    if (!alternateTuning) return;
    const preset = findTuningPreset(alternateTuning, guitarType);
    if (!preset) return;
    if (preset.id === tuning.id) return;
    if (tuner.isActive) void tuner.stopListening();
    setTuning(preset);
    setTunedStrings(new Set());
    setSelectedString(null);
  }, [
    alternateTuning,
    guitarType,
    tuner.isActive,
    tuner.stopListening,
    tuning.id,
  ]);

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

  const circleSize = Math.min(
    width * (tuning.strings.length > 8 ? 0.09 : 0.12),
    tuning.strings.length > 8 ? 40 : 48,
  );
  const usesGuitarHeadstock =
    tuning.strings.length === 6 && profile.headstock !== undefined;

  // Whichever string the readout currently describes: the chosen one, or
  // the detector's guess when nothing is chosen.
  const aimedString = selectedString ?? tuner.stringIndex;
  const aimedColor =
    aimedString !== null && tuner.verdict
      ? VERDICT_COLORS[tuner.verdict]
      : Colors.success;

  const handleSelectString = useCallback(
    (index: number, note: string) => {
      // Tapping the chosen string again hands control back to auto-detect.
      setSelectedString((prev) => (prev === index ? null : index));
      handlePlayReference(note);
    },
    [handlePlayReference]
  );

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
        <Text style={styles.instrumentLabel}>
          {profile.name} · A4 {tuner.referencePitchHz} Hz
          {profile.experimental ? ' · experimental low range' : ''}
        </Text>
      </View>

      <Text style={styles.aimHint} numberOfLines={1}>
        {selectedString !== null
          ? `Tuning ${stringLabels[selectedString]} · tap it again for auto`
          : tuning.strings.length === 0
          ? 'Chromatic mode · play one clear note at a time'
          : 'Tap a string for the most accurate guided tuning'}
      </Text>

      {usesGuitarHeadstock ? <View style={styles.stringsArea}>
        <View style={styles.stringColumn}>
          {[0, 1, 2].map((i) => (
            <StringChip
              key={`left-${i}`}
              index={i}
              label={stringLabels[i]}
              note={tuning.strings[i]}
              positionLabel={tuningTargetLabel(tuning, i)}
              size={circleSize}
              selected={selectedString === i}
              aimed={aimedString === i}
              verdict={aimedString === i ? tuner.verdict : null}
              tuned={tunedStrings.has(i)}
              onPress={handleSelectString}
            />
          ))}
        </View>

        <View style={styles.headstockArea}>
          <HeadstockSvg
            guitarType={profile.headstock ?? 'acoustic'}
            highlightColor={aimedColor}
            highlightedPeg={aimedString ?? undefined}
          />
        </View>

        <View style={styles.stringColumn}>
          {[3, 4, 5].map((i) => (
            <StringChip
              key={`right-${i}`}
              index={i}
              label={stringLabels[i]}
              note={tuning.strings[i]}
              positionLabel={tuningTargetLabel(tuning, i)}
              size={circleSize}
              selected={selectedString === i}
              aimed={aimedString === i}
              verdict={aimedString === i ? tuner.verdict : null}
              tuned={tunedStrings.has(i)}
              onPress={handleSelectString}
            />
          ))}
        </View>
      </View> : tuning.strings.length > 0 ? (
        <View style={styles.dynamicInstrumentArea}>
          <View style={styles.genericNeck}>
            <Text style={styles.genericInstrumentIcon}>{profile.icon}</Text>
            <Text style={styles.genericInstrumentName}>{profile.shortName}</Text>
          </View>
          <View style={styles.dynamicStringGrid}>
            {tuning.strings.map((note, index) => (
              <View key={`${index}-${note}`} style={styles.dynamicStringItem}>
                <StringChip
                  index={index}
                  label={stringLabels[index]}
                  note={note}
                  positionLabel={tuningTargetLabel(tuning, index)}
                  size={circleSize}
                  selected={selectedString === index}
                  aimed={aimedString === index}
                  verdict={aimedString === index ? tuner.verdict : null}
                  tuned={tunedStrings.has(index)}
                  onPress={handleSelectString}
                />
                <Text style={styles.stringOctave}>{note}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.chromaticBadge}>
          <Text style={styles.chromaticIcon}>♪</Text>
          <Text style={styles.chromaticText}>Any instrument · any note</Text>
        </View>
      )}

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
          {hasPitch
            ? `${tuner.frequency.toFixed(1)} Hz · ${Math.round(tuner.confidence * 100)}% signal`
            : ' '}
        </Text>
        <Text
          style={[
            styles.signalHint,
            tuner.signal === 'noisy' && { color: Colors.warning },
          ]}
          numberOfLines={2}
          accessibilityLiveRegion="polite"
        >
          {signalHint || ' '}
        </Text>
      </View>

      <View style={styles.bottomArea}>
        {tuner.error && (
          <Text
            style={styles.tunerError}
            accessibilityRole="alert"
            numberOfLines={2}
          >
            {tuner.error.message.replace(/[.\s]+$/, '')}. Enable the mic in your
            device settings.
          </Text>
        )}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <PressableScale
            onPress={handleToggleTuning}
            disabled={tuner.isStarting}
            style={[
              styles.tuneButton,
              {
                backgroundColor: tuner.isActive
                  ? Colors.dark.surfaceElevated
                  : Colors.success,
              },
            ]}
            accessibilityLabel={
              tuner.isStarting
                ? 'Starting tuner'
                : tuner.isActive
                ? 'Stop tuning'
                : 'Tap to start tuning'
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: tuner.isStarting }}
          >
            <Text
              style={[
                styles.tuneButtonText,
                { color: tuner.isActive ? Colors.dark.text : '#fff' },
              ]}
            >
              {tuner.isStarting
                ? 'Starting…'
                : tuner.isActive
                ? 'Stop'
                : tuner.error
                ? 'Try Again'
                : 'Tap to Tune'}
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
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled
              renderSectionHeader={({ section }) => (
                <Text style={styles.sectionHeader}>{section.title}</Text>
              )}
              renderItem={({ item }) => {
                const isSelected =
                  item.id === tuning.id;
                const itemProfile = instrumentProfile(item.instrumentId);
                return (
                  <PressableScale
                    onPress={() => handleSelectTuning(item)}
                    style={[
                      styles.presetRow,
                      isSelected && styles.presetRowSelected,
                    ]}
                    accessibilityLabel={`${item.name} tuning for ${itemProfile.name}${isSelected ? ', currently selected' : ''}`}
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
                        {item.strings.length > 0
                          ? item.strings.join(' - ')
                          : 'All notes'}
                      </Text>
                      {itemProfile.experimental && (
                        <Text style={styles.experimentalText}>
                          Experimental · verify on your device
                        </Text>
                      )}
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
  instrumentLabel: {
    color: Colors.dark.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
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
  dynamicInstrumentArea: {
    paddingHorizontal: 18,
    marginTop: 8,
    alignItems: 'center',
    gap: 8,
  },
  genericNeck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  genericInstrumentIcon: {
    fontSize: 15,
  },
  genericInstrumentName: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '700',
  },
  dynamicStringGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 10,
    rowGap: 2,
  },
  dynamicStringItem: {
    alignItems: 'center',
  },
  stringOctave: {
    color: Colors.dark.muted,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
    marginTop: -2,
  },
  chromaticBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  chromaticIcon: {
    color: Colors.success,
    fontSize: 18,
    fontWeight: '800',
  },
  chromaticText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
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
    // Without a floor the readout is squeezed by anything that appears
    // below it (the mic-permission message) and its fixed-height children
    // spill over the text underneath instead of the column reflowing.
    minHeight: 0,
    flexShrink: 1,
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
  signalHint: {
    minHeight: 32,
    maxWidth: 310,
    marginTop: 5,
    paddingHorizontal: 10,
    color: Colors.dark.muted,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
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
  aimHint: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.muted,
    marginBottom: 6,
  },
  tunerError: {
    marginHorizontal: 24,
    marginBottom: 8,
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
  experimentalText: {
    color: Colors.warning,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  checkmark: {
    color: Colors.success,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
});
