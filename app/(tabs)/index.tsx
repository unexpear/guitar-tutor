import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  SectionList,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useKeepAwake } from 'expo-keep-awake';
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
import { useSettingsStore } from '../../features/store/settingsStore';
import { useTuningStore } from '../../features/store/tuningStore';
import { guitarDesign } from '../../features/progression/guitarDesigns';

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

function StageMode({ note, cents, label, color, onClose }: { note: string; cents: string; label: string; color: string; onClose: () => void }) {
  useKeepAwake('standardtune-stage');
  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.stageContainer}>
        <PressableScale onPress={onClose} style={styles.stageClose} accessibilityRole="button" accessibilityLabel="Exit stage mode"><Text style={styles.stageCloseText}>Exit</Text></PressableScale>
        <Text style={[styles.stageNote, { color }]}>{note}</Text>
        <Text style={[styles.stageCents, { color }]}>{cents}¢</Text>
        <Text style={[styles.stageLabel, { color }]}>{label}</Text>
        <Text style={styles.stageHelp}>Screen stays awake while stage mode is open.</Text>
      </View>
    </Modal>
  );
}

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
  const router = useRouter();
  const { width, height, fontScale } = useWindowDimensions();
  const alternateTuning = useProgressStore((s) => s.alternateTuning);
  const setAlternateTuning = useProgressStore((s) => s.setAlternateTuning);
  const selectedGuitarDesignId = useProgressStore((s) => s.selectedGuitarDesignId);
  const selectedGuitarDesign = guitarDesign(selectedGuitarDesignId);
  const guitarType = useUserPreferencesStore((s) => s.guitarType);
  const customTunings = useTuningStore((s) => s.customTunings);
  const meterStyle = useSettingsStore((s) => s.meterStyle);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const spokenFeedbackEnabled = useSettingsStore((s) => s.spokenFeedbackEnabled);
  const autoAdvanceStrings = useSettingsStore((s) => s.autoAdvanceStrings);
  const [tuning, setTuning] = useState<TuningPreset>(
    () => customTunings.find((item) => item.id === alternateTuning) ?? findTuningPreset(alternateTuning, guitarType) ?? TUNING_PRESETS[0],
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [diagnosticsVisible, setDiagnosticsVisible] = useState(false);
  const [stageVisible, setStageVisible] = useState(false);
  const [tunedStrings, setTunedStrings] = useState<Set<number>>(new Set());
  const [pitchHistory, setPitchHistory] = useState<number[]>([]);
  /** The string the user picked, or null to let the tuner guess. */
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const pulseValue = useSharedValue(1);
  const needleX = useSharedValue(0);
  const strobeX = useSharedValue(0);

  const sections = useMemo(() => [
    ...(customTunings.length > 0 ? [{ title: 'My tunings', data: customTunings }] : []),
    ...SECTIONS,
  ], [customTunings]);

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

  useEffect(() => {
    if (!hasPitch || tuner.signal !== 'clear') return;
    setPitchHistory((history) => [...history, clampedCents].slice(-24));
  }, [clampedCents, hasPitch, tuner.frequency, tuner.signal]);

  // Animate the needle instead of snapping per pitch event.
  useEffect(() => {
    needleX.value = withTiming(
      (clampedCents / 100) * NEEDLE_TRACK_WIDTH,
      { duration: 120, easing: Easing.out(Easing.quad) },
    );
  }, [clampedCents, needleX]);

  useEffect(() => {
    if (!hasPitch || Math.abs(clampedCents) <= tuner.inTuneCents) {
      cancelAnimation(strobeX);
      strobeX.value = withTiming(0, { duration: 120 });
      return;
    }
    const direction = clampedCents > 0 ? -1 : 1;
    const duration = Math.max(160, 650 - Math.abs(clampedCents) * 9);
    strobeX.value = 0;
    strobeX.value = withRepeat(withTiming(direction * 36, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(strobeX);
  }, [clampedCents, hasPitch, strobeX, tuner.inTuneCents]);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: needleX.value }],
  }));
  const strobeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: strobeX.value }] }));

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
      if (hapticsEnabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (spokenFeedbackEnabled) Speech.speak(`${tuning.strings[stringIndex]} in tune`, { rate: 0.95 });
      if (autoAdvanceStrings && selectedString === stringIndex) {
        setSelectedString(stringIndex + 1 < tuning.strings.length ? stringIndex + 1 : null);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [autoAdvanceStrings, hapticsEnabled, isTuned, selectedString, spokenFeedbackEnabled, tuner.stringIndex, tuning.strings]);

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
    const preset = customTunings.find((item) => item.id === alternateTuning) ?? findTuningPreset(alternateTuning, guitarType);
    if (!preset) return;
    if (preset.id === tuning.id) return;
    if (tuner.isActive) void tuner.stopListening();
    setTuning(preset);
    setTunedStrings(new Set());
    setSelectedString(null);
  }, [
    alternateTuning,
    customTunings,
    guitarType,
    tuner.isActive,
    tuner.stopListening,
    tuning.id,
  ]);

  const prevActiveRef = React.useRef(false);
  useEffect(() => {
    if (tuner.isActive && !prevActiveRef.current) {
      setTunedStrings(new Set()); // fresh session
      setPitchHistory([]);
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

  const compactLayout = height < 700 || fontScale > 1.3;
  const showStringControls = !(height < 700 && fontScale > 1.5);
  const circleSize = Math.min(
    width * (tuning.strings.length > 8 ? 0.09 : 0.12),
    tuning.strings.length > 8 ? 40 : compactLayout ? 40 : 48,
  );
  const usesGuitarHeadstock =
    tuning.strings.length === 6 && profile.headstock !== undefined && !compactLayout && showStringControls;

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
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
        <View style={styles.modeButtons}>
          <PressableScale onPress={() => setStageVisible(true)} style={styles.modeButton} accessibilityRole="button">
            <Text style={styles.modeButtonText}>Stage</Text>
          </PressableScale>
          <PressableScale onPress={() => setDiagnosticsVisible(true)} style={styles.modeButton} accessibilityRole="button">
            <Text style={styles.modeButtonText}>Signal help</Text>
          </PressableScale>
        </View>
      </View>

      <Text style={styles.aimHint} numberOfLines={1}>
        {!showStringControls
          ? 'Large text mode · automatic string detection'
          : selectedString !== null
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
            design={selectedGuitarDesign}
            highlightColor={aimedColor}
            highlightedPeg={aimedString ?? undefined}
            width={compactLayout ? 150 : 200}
            height={compactLayout ? 240 : 320}
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
      </View> : tuning.strings.length > 0 && showStringControls ? (
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
      ) : tuning.strings.length === 0 ? (
        <View style={styles.chromaticBadge}>
          <Text style={styles.chromaticIcon}>♪</Text>
          <Text style={styles.chromaticText}>Any instrument · any note</Text>
        </View>
      ) : null}

      <View style={[styles.centerDisplay, compactLayout && styles.centerDisplayCompact]}>
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

        <View style={styles.centsRow}>
          <Text style={[styles.centsValue, { color: centsColor }]}>
            {centsDisplay}
          </Text>
          <Text style={styles.centsUnit}>cents</Text>
        </View>
        <Text style={[styles.centsLabel, { color: centsColor }]}>
          {centsLabel}
        </Text>

        {meterStyle === 'needle' ? <View style={styles.gauge}>
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
        </View> : <View style={[styles.strobeWindow, { borderColor: centsColor }]} accessibilityLabel={`Strobe meter, ${centsLabel}`}>
          <Animated.View style={[styles.strobeBand, strobeStyle]}>
            {Array.from({ length: 18 }, (_, index) => (
              <View key={index} style={[styles.strobeStripe, { backgroundColor: index % 2 === 0 ? centsColor : 'transparent' }]} />
            ))}
          </Animated.View>
          <View style={styles.strobeCenter} />
        </View>}
        <View style={styles.gaugeScaleRow}>
          <Text style={styles.gaugeScaleText}>-50</Text>
          <Text style={styles.gaugeScaleText}>0</Text>
          <Text style={styles.gaugeScaleText}>+50</Text>
        </View>

        <Text style={styles.freqText}>
          {hasPitch
            ? `${tuner.frequency.toFixed(1)} Hz · ${Math.round(tuner.confidence * 100)}% signal`
            : ' '}
        </Text>
        <View style={styles.history} accessibilityLabel="Recent pitch stability history">
          {pitchHistory.map((value, index) => (
            <View key={index} style={[styles.historyDot, { backgroundColor: Math.abs(value) <= tuner.inTuneCents ? Colors.success : Math.abs(value) < 10 ? Colors.warning : Colors.danger, transform: [{ translateY: (value / 50) * 8 }] }]} />
          ))}
        </View>
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
      </ScrollView>

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
              sections={sections}
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
            <PressableScale onPress={() => { setPickerVisible(false); router.push('/custom-tunings'); }} style={styles.manageTuningsButton} accessibilityRole="button">
              <Text style={styles.manageTuningsText}>Create or manage custom tunings</Text>
            </PressableScale>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={diagnosticsVisible} transparent animationType="fade" onRequestClose={() => setDiagnosticsVisible(false)}>
        <Pressable style={styles.diagnosticOverlay} onPress={() => setDiagnosticsVisible(false)}>
          <Pressable style={styles.diagnosticCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.diagnosticTitle}>Why no steady reading?</Text>
            <Text style={styles.diagnosticText}>Signal: {tuner.signal} · level {Math.round(tuner.rmsDb)} dBFS · confidence {Math.round(tuner.confidence * 100)}%</Text>
            <Text style={styles.diagnosticText}>Pluck one string once, mute the others, uncover the phone microphone, and move away from fans or speech.</Text>
            <Text style={styles.diagnosticText}>For bass or a soft acoustic instrument, choose Quiet sensitivity in Settings. In a loud room, choose Noisy.</Text>
            {tuner.harmonicRatio !== 1 && <Text style={styles.diagnosticWarning}>An overtone was corrected ×{tuner.harmonicRatio}. Guided string mode is safer than automatic mode here.</Text>}
            <PressableScale onPress={() => setDiagnosticsVisible(false)} style={styles.diagnosticButton}><Text style={styles.diagnosticButtonText}>Got it</Text></PressableScale>
          </Pressable>
        </Pressable>
      </Modal>
      {stageVisible && <StageMode note={displayNote} cents={centsDisplay} label={centsLabel} color={centsColor} onClose={() => setStageVisible(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    flexGrow: 1,
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
  modeButtons: { flexDirection: 'row', gap: 8, marginTop: 7 },
  modeButton: { minHeight: 40, justifyContent: 'center', borderRadius: 18, paddingHorizontal: 13, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  modeButtonText: { color: Colors.dark.muted, fontSize: 12, fontWeight: '700' },
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
  centerDisplayCompact: {
    minHeight: 280,
    flex: 0,
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
  strobeWindow: { width: NEEDLE_TRACK_WIDTH, height: 44, overflow: 'hidden', borderWidth: 1, borderRadius: 8, justifyContent: 'center' },
  strobeBand: { width: NEEDLE_TRACK_WIDTH + 72, height: 44, marginLeft: -36, flexDirection: 'row' },
  strobeStripe: { width: 20, height: 44, opacity: 0.68 },
  strobeCenter: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: '#fff' },
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
  history: { width: 154, height: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3 },
  historyDot: { width: 3, height: 3, borderRadius: 2 },
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
  manageTuningsButton: { minHeight: 52, margin: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.success },
  manageTuningsText: { color: Colors.success, fontWeight: '700' },
  diagnosticOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  diagnosticCard: { width: '100%', maxWidth: 440, borderRadius: 18, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 20 },
  diagnosticTitle: { color: Colors.dark.text, fontSize: 21, fontWeight: '800', marginBottom: 12 },
  diagnosticText: { color: Colors.dark.text, fontSize: 14, lineHeight: 21, marginBottom: 10 },
  diagnosticWarning: { color: Colors.warning, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  diagnosticButton: { minHeight: 48, marginTop: 6, borderRadius: 12, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  diagnosticButtonText: { color: '#071408', fontWeight: '800' },
  stageContainer: { flex: 1, backgroundColor: '#030307', alignItems: 'center', justifyContent: 'center' },
  stageClose: { position: 'absolute', top: 42, right: 20, minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, borderWidth: 1, borderColor: '#555' },
  stageCloseText: { color: '#fff', fontWeight: '700' },
  stageNote: { fontSize: 150, fontWeight: '900' },
  stageCents: { fontSize: 54, fontWeight: '800', fontVariant: ['tabular-nums'] },
  stageLabel: { fontSize: 23, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', marginTop: 8 },
  stageHelp: { position: 'absolute', bottom: 38, color: '#999', fontSize: 12 },
});
