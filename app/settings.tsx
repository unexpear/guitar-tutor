import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Modal,
  Pressable,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Colors, CARD_SHADOW } from '../constants/Colors';
import PressableScale from '../components/PressableScale';
import { useProgressStore } from '../features/store/progressStore';
import { minutesFrom } from '../features/practice/streak';
import * as Linking from 'expo-linking';
import { useUserPreferencesStore } from '../features/store/userPreferencesStore';
import { useSettingsStore } from '../features/store/settingsStore';
import { useTuningStore } from '../features/store/tuningStore';
import {
  findTuningPreset,
  TUNING_PRESETS,
} from '../features/tuner/data/tunings';
import {
  INSTRUMENT_PROFILES,
  instrumentProfile,
} from '../features/tuner/data/instrumentProfiles';

const ACCENT = Colors.success;
const APP_VERSION = Constants.expoConfig?.version ?? 'Unknown';

/** 95 -> "1h 35m", 40 -> "40m". */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, CARD_SHADOW]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingRow({
  label,
  right,
}: {
  label: string;
  right: React.ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </View>
  );
}

function CustomSwitch({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel: string;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#3a3a5c', true: ACCENT }}
      thumbColor={value ? '#fff' : '#ccc'}
      ios_backgroundColor="#3a3a5c"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
    />
  );
}

function CustomSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  accessibilityLabel,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  accessibilityLabel: string;
}) {
  const range = max - min;
  const fraction = (value - min) / range;
  const trackWidthRef = React.useRef(1);

  const handleTouch = (evt: { nativeEvent: { locationX: number } }) => {
    const x = evt.nativeEvent.locationX;
    const raw = min + (x / trackWidthRef.current) * range;
    const snapped = Math.round(raw / step) * step;
    const clamped = Math.min(max, Math.max(min, snapped));
    onValueChange(clamped);
  };

  return (
    <View
      style={styles.sliderContainer}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{
        min,
        max,
        now: value,
        text: `${value}`,
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') {
          onValueChange(Math.min(max, value + step));
        }
        if (event.nativeEvent.actionName === 'decrement') {
          onValueChange(Math.max(min, value - step));
        }
      }}
    >
      <View
        style={styles.sliderTouchArea}
        onLayout={(e) => {
          trackWidthRef.current = Math.max(1, e.nativeEvent.layout.width);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
      >
        <View style={styles.sliderTrack} pointerEvents="none">
          <View
            style={[
              styles.sliderFill,
              { width: `${fraction * 100}%` },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              { left: `${fraction * 100}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function ChoiceButtons<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <View style={styles.choiceGroup} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => (
        <PressableScale
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.choiceButton, value === option.value && styles.choiceButtonActive]}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === option.value }}
        >
          <Text style={[styles.choiceText, value === option.value && styles.choiceTextActive]}>{option.label}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

function NumericStepper({
  value,
  min,
  max,
  unit,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <View style={styles.goalControl}>
      <PressableScale
        onPress={() => onChange(value - 1)}
        disabled={value <= min}
        style={[styles.goalButton, value <= min && styles.stepperDisabled]}
        accessibilityLabel={`Decrease ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: value <= min }}
      >
        <Text style={styles.goalButtonText}>−</Text>
      </PressableScale>
      <Text
        style={styles.stepperValue}
        accessibilityLabel={`${label}: ${value} ${unit}`}
      >
        {value} {unit}
      </Text>
      <PressableScale
        onPress={() => onChange(value + 1)}
        disabled={value >= max}
        style={[styles.goalButton, value >= max && styles.stepperDisabled]}
        accessibilityLabel={`Increase ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: value >= max }}
      >
        <Text style={styles.goalButtonText}>+</Text>
      </PressableScale>
    </View>
  );
}

function TuningPicker({
  current,
  onSelect,
  guitarType,
}: {
  current: string;
  onSelect: (id: string) => void;
  guitarType: 'acoustic' | 'electric' | 'classical';
}) {
  const [visible, setVisible] = useState(false);
  const customTunings = useTuningStore((state) => state.customTunings);
  const currentPreset =
    customTunings.find((preset) => preset.id === current) ??
    findTuningPreset(current, guitarType) ?? TUNING_PRESETS[0];
  const currentProfile = instrumentProfile(currentPreset.instrumentId);

  return (
    <>
      <PressableScale
        onPress={() => setVisible(true)}
        style={styles.pickerButton}
        accessibilityLabel={`Tuning: ${currentPreset.name} for ${currentProfile.name}. Tap to change`}
        accessibilityRole="button"
      >
        <Text style={styles.pickerButtonText}>{currentPreset.name}</Text>
        <Text style={styles.pickerChevron}>›</Text>
      </PressableScale>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        accessibilityLabel="Tuning selection"
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Tuning</Text>
            <ScrollView style={styles.modalScroll}>
              {customTunings.length > 0 && (
                <View>
                  <Text style={styles.modalSectionTitle}>My tunings</Text>
                  {customTunings.map((preset) => (
                    <PressableScale key={preset.id} onPress={() => { onSelect(preset.id); setVisible(false); }} style={[styles.modalOption, preset.id === currentPreset.id && styles.modalOptionActive]} accessibilityRole="button">
                      <View><Text style={styles.modalOptionText}>{preset.name}</Text><Text style={styles.modalOptionNotes}>{preset.strings.join(' · ')}</Text></View>
                      {preset.id === currentPreset.id && <Text style={styles.checkmark}>✓</Text>}
                    </PressableScale>
                  ))}
                </View>
              )}
              {INSTRUMENT_PROFILES.map((profile) => {
                const presets = TUNING_PRESETS.filter(
                  (preset) => preset.instrumentId === profile.id,
                );
                if (presets.length === 0) return null;
                return (
                  <View key={profile.id}>
                    <Text style={styles.modalSectionTitle}>{profile.name}</Text>
                    {presets.map((preset) => {
                      const selected = preset.id === currentPreset.id;
                      return (
                        <PressableScale
                          key={preset.id}
                          onPress={() => {
                            onSelect(preset.id);
                            setVisible(false);
                          }}
                          style={[
                            styles.modalOption,
                            selected && styles.modalOptionActive,
                          ]}
                          accessibilityLabel={`${preset.name} for ${profile.name}${selected ? ' (current)' : ''}`}
                          accessibilityRole="button"
                        >
                          <View>
                            <Text
                              style={[
                                styles.modalOptionText,
                                selected && styles.modalOptionTextActive,
                              ]}
                            >
                              {preset.name}
                            </Text>
                            <Text style={styles.modalOptionNotes}>
                              {preset.strings.length > 0
                                ? preset.strings.join(' · ')
                                : 'Any note'}
                            </Text>
                          </View>
                          {selected && <Text style={styles.checkmark}>✓</Text>}
                        </PressableScale>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
            <PressableScale
              onPress={() => setVisible(false)}
              style={styles.modalCloseButton}
              accessibilityLabel="Close tuning selection"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </PressableScale>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { alternateTuning, setAlternateTuning } = useProgressStore();
  const practiceLog = useProgressStore((s) => s.practiceLog);
  const totalPracticeMinutes = useProgressStore((s) => s.totalPracticeMinutes);
  const longestStreak = useProgressStore((s) => s.longestStreak);
  const practiceSecondsToday = useProgressStore((s) => s.practiceSecondsToday);
  const liveStreak = useProgressStore((s) => s.liveStreak);
  // practiceLog is read so this recomputes when a session is logged.
  void practiceLog;
  const minutesToday = minutesFrom(practiceSecondsToday());
  const streak = liveStreak();
  const { guitarType, experienceLevel, tuningPreference, resetQuestionnaire } =
    useUserPreferencesStore();
  const selectedTunerPreset =
    useTuningStore((state) => state.customTunings).find((preset) => preset.id === alternateTuning) ??
    findTuningPreset(alternateTuning, guitarType) ?? TUNING_PRESETS[0];
  const selectedTunerProfile = instrumentProfile(selectedTunerPreset.instrumentId);

  const {
    soundsEnabled,
    sampleVolume,
    practiceGoalMinutes,
    referencePitchHz,
    inTuneToleranceCents,
    tunerSensitivity,
    meterStyle,
    leftHanded,
    hapticsEnabled,
    spokenFeedbackEnabled,
    autoAdvanceStrings,
    setSoundsEnabled,
    setSampleVolume,
    setPracticeGoalMinutes,
    setReferencePitchHz,
    setInTuneToleranceCents,
    setTunerSensitivity,
    setMeterStyle,
    setLeftHanded,
    setHapticsEnabled,
    setSpokenFeedbackEnabled,
    setAutoAdvanceStrings,
  } = useSettingsStore();

  const handleRetakeQuestionnaire = () => {
    Alert.alert(
      'Retake the questionnaire?',
      'Your guitar type, experience level and preferred tuning will be cleared and asked again. Lesson progress and practice history are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retake',
          style: 'destructive',
          onPress: () => {
            resetQuestionnaire();
            router.replace('/(tabs)/lessons');
          },
        },
      ]
    );
  };

  const getGuitarTypeLabel = () => {
    switch (guitarType) {
      case 'acoustic': return 'Acoustic Guitar';
      case 'electric': return 'Electric Guitar';
      case 'classical': return 'Classical Guitar';
      default: return 'Not set';
    }
  };

  const getExperienceLabel = () => {
    switch (experienceLevel) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return 'Not set';
    }
  };

  const getTuningLabel = () => {
    switch (tuningPreference) {
      case 'standard': return 'Standard E (EADGBE)';
      case 'drop_d': return 'Drop D (DADGBE)';
      case 'open_g': return 'Open G (DGDGBD)';
      case 'open_d': return 'Open D (DADF#AD)';
      case 'dadgad': return 'DADGAD (DADGAD)';
      default: return 'Not set';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backArrow}>←</Text>
        </PressableScale>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="Tuning">
          <SettingRow
            label="Current Tuning"
            accessibilityLabel={`Current tuning: ${selectedTunerPreset.name} for ${selectedTunerProfile.name}`}
            right={
              <TuningPicker
                current={alternateTuning}
                onSelect={setAlternateTuning}
                guitarType={guitarType}
              />
            }
          />
          <SettingRow
            label="Reference Pitch"
            accessibilityLabel={`Reference pitch: A4 equals ${referencePitchHz} hertz`}
            right={
              <NumericStepper
                value={referencePitchHz}
                min={430}
                max={450}
                unit="Hz"
                label="reference pitch"
                onChange={setReferencePitchHz}
              />
            }
          />
          <SettingRow
            label="In-Tune Window"
            accessibilityLabel={`In-tune window: plus or minus ${inTuneToleranceCents} cents`}
            right={
              <NumericStepper
                value={inTuneToleranceCents}
                min={1}
                max={5}
                unit="¢"
                label="in-tune window"
                onChange={setInTuneToleranceCents}
              />
            }
          />
          <Text style={styles.hint}>
            A4 defaults to the ISO 440 Hz standard. Use ±1 cent for precise
            setup or a wider window for easier everyday tuning.
          </Text>
          <SettingRow
            label="Room sensitivity"
            right={<ChoiceButtons value={tunerSensitivity} options={[{ value: 'quiet', label: 'Quiet' }, { value: 'normal', label: 'Normal' }, { value: 'noisy', label: 'Noisy' }]} onChange={setTunerSensitivity} label="Tuner room sensitivity" />}
          />
          <Text style={styles.hint}>Quiet hears softer notes. Noisy rejects more fans, voices and room sound.</Text>
          <TouchableOpacity style={styles.retakeButton} onPress={() => router.push('/custom-tunings')} accessibilityRole="button" accessibilityLabel="Manage custom tunings">
            <Text style={styles.retakeButtonText}>Manage Custom Tunings</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Appearance">
          {/* There is only a dark palette, so this reports the theme rather
              than offering a switch that cannot do anything. */}
          <SettingRow
            label="Theme"
            accessibilityLabel="Theme: dark"
            right={<Text style={styles.staticValue}>Dark</Text>}
          />
          <Text style={styles.hint}>
            Dark only, so the screen stays readable in a dim room.
          </Text>
          <SettingRow label="Tuner meter" right={<ChoiceButtons value={meterStyle} options={[{ value: 'needle', label: 'Needle' }, { value: 'strobe', label: 'Strobe' }]} onChange={setMeterStyle} label="Tuner meter style" />} />
          <SettingRow label="Left-handed diagrams" right={<CustomSwitch value={leftHanded} onValueChange={setLeftHanded} accessibilityLabel="Toggle left-handed chord diagrams" />} />
        </SectionCard>

        <SectionCard title="Audio">
          <SettingRow
            label="Play Sounds"
            accessibilityLabel={`Play sounds: ${soundsEnabled ? 'on' : 'off'}`}
            right={
              <CustomSwitch
                value={soundsEnabled}
                onValueChange={setSoundsEnabled}
                accessibilityLabel="Toggle play sounds"
              />
            }
          />
          <SettingRow
            label="Sample Volume"
            accessibilityLabel={`Sample volume: ${sampleVolume}%`}
            right={
              <CustomSlider
                value={sampleVolume}
                onValueChange={setSampleVolume}
                min={0}
                max={100}
                step={5}
                accessibilityLabel="Sample volume slider"
              />
            }
          />
          <SettingRow label="Haptic in-tune cue" right={<CustomSwitch value={hapticsEnabled} onValueChange={setHapticsEnabled} accessibilityLabel="Toggle haptic in-tune cue" />} />
          <SettingRow label="Spoken tuner cues" right={<CustomSwitch value={spokenFeedbackEnabled} onValueChange={setSpokenFeedbackEnabled} accessibilityLabel="Toggle spoken tuner cues" />} />
          <SettingRow label="Auto-advance strings" right={<CustomSwitch value={autoAdvanceStrings} onValueChange={setAutoAdvanceStrings} accessibilityLabel="Toggle automatic string advance" />} />
        </SectionCard>

        <SectionCard title="Practice">
          <SettingRow
            label="Practice Goal"
            accessibilityLabel={`Practice goal: ${practiceGoalMinutes} minutes per day`}
            right={
              <View style={styles.goalControl}>
                <PressableScale
                  onPress={() => setPracticeGoalMinutes(practiceGoalMinutes - 5)}
                  style={styles.goalButton}
                  accessibilityLabel="Decrease practice goal"
                  accessibilityRole="button"
                >
                  <Text style={styles.goalButtonText}>−</Text>
                </PressableScale>
                <Text style={styles.goalValue}>{practiceGoalMinutes}m</Text>
                <PressableScale
                  onPress={() => setPracticeGoalMinutes(practiceGoalMinutes + 5)}
                  style={styles.goalButton}
                  accessibilityLabel="Increase practice goal"
                  accessibilityRole="button"
                >
                  <Text style={styles.goalButtonText}>+</Text>
                </PressableScale>
              </View>
            }
          />
          <Text style={styles.hint}>
            {minutesToday >= practiceGoalMinutes
              ? `${minutesToday}m today - goal met.`
              : `${minutesToday}m of ${practiceGoalMinutes}m today.`}
            {streak > 1 ? ` ${streak}-day streak.` : ''}
          </Text>
          {totalPracticeMinutes > 0 && (
            <SettingRow
              label="Time played"
              accessibilityLabel={`Total time played: ${formatDuration(totalPracticeMinutes)}`}
              right={
                <Text style={styles.staticValue}>
                  {formatDuration(totalPracticeMinutes)}
                </Text>
              }
            />
          )}
          {longestStreak > 1 && (
            <SettingRow
              label="Best streak"
              accessibilityLabel={`Best streak: ${longestStreak} days`}
              right={<Text style={styles.staticValue}>{longestStreak} days</Text>}
            />
          )}
        </SectionCard>

        <SectionCard title="Personalization">
          <SettingRow
            label="Guitar Type"
            accessibilityLabel={`Guitar type: ${getGuitarTypeLabel()}`}
            right={<Text style={styles.rowValue}>{getGuitarTypeLabel()}</Text>}
          />
          <SettingRow
            label="Experience"
            accessibilityLabel={`Experience level: ${getExperienceLabel()}`}
            right={<Text style={styles.rowValue}>{getExperienceLabel()}</Text>}
          />
          <SettingRow
            label="Preferred Tuning"
            accessibilityLabel={`Preferred tuning: ${getTuningLabel()}`}
            right={<Text style={styles.rowValue}>{getTuningLabel()}</Text>}
          />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetakeQuestionnaire}
            accessibilityLabel="Retake questionnaire to change your preferences"
            accessibilityRole="button"
          >
            <Text style={styles.retakeButtonText}>Retake Questionnaire</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="About">
          <SettingRow
            label="Access"
            accessibilityLabel="Free forever, with no ads and no account"
            right={<Text style={styles.rowValue}>Free · No ads</Text>}
          />
          <SettingRow
            label="Audio Privacy"
            accessibilityLabel="Microphone audio stays on this device"
            right={<Text style={styles.rowValue}>On device</Text>}
          />
          <SettingRow
            label="App Name"
            accessibilityLabel="App name: StandardTune"
            right={<Text style={styles.rowValue}>StandardTune</Text>}
          />
          <SettingRow
            label="Version"
            accessibilityLabel={`App version: ${APP_VERSION}`}
            right={<Text style={styles.rowValue}>{APP_VERSION}</Text>}
          />
          <TouchableOpacity
            onPress={() =>
              Linking.openURL('https://github.com/unexpear/guitar-tutor/blob/main/PRIVACY.md')
            }
            accessibilityRole="link"
            accessibilityLabel="Open the privacy policy in your browser"
          >
            <SettingRow
              label="Privacy Policy"
              accessibilityLabel="Privacy policy"
              right={<Text style={styles.rowLink}>View ↗</Text>}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(`https://github.com/unexpear/guitar-tutor/issues/new?title=${encodeURIComponent('App feedback')}&body=${encodeURIComponent(`StandardTune ${APP_VERSION}\n\nWhat happened or what should improve?\n`)}`)}
            accessibilityRole="link"
            accessibilityLabel="Send feedback or report incorrect content on GitHub"
          >
            <SettingRow label="Feedback & Corrections" right={<Text style={styles.rowLink}>Report ↗</Text>} />
          </TouchableOpacity>
        </SectionCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: Colors.spacing.md,
    paddingBottom: Colors.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: Colors.dark.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Colors.spacing.md,
    paddingBottom: Colors.spacing.xxl,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginBottom: Colors.spacing.md,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Colors.spacing.md,
    paddingTop: Colors.spacing.md,
    paddingBottom: Colors.spacing.sm,
  },
  sectionContent: {
    paddingHorizontal: Colors.spacing.md,
    paddingBottom: Colors.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 48,
  },
  rowLabel: {
    fontSize: 16,
    color: Colors.dark.text,
    flex: 1,
  },
  rowLink: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.success,
  },
  rowValue: {
    fontSize: 16,
    color: Colors.dark.muted,
  },
  staticValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.muted,
  },
  hint: {
    fontSize: 12,
    color: Colors.dark.muted,
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Colors.radius.sm,
    gap: 8,
  },
  pickerButtonText: {
    fontSize: 14,
    color: Colors.dark.text,
  },
  pickerChevron: {
    fontSize: 18,
    color: Colors.dark.muted,
  },
  sliderContainer: {
    width: 160,
    height: 48,
    justifyContent: 'center',
  },
  sliderTouchArea: {
    flex: 1,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a3a5c',
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  goalControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT,
    minWidth: 36,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: Colors.radius.xl,
    borderTopRightRadius: Colors.radius.xl,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalScroll: {
    paddingHorizontal: Colors.spacing.md,
  },
  choiceGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4 },
  choiceButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  choiceButtonActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  choiceText: { color: Colors.dark.muted, fontSize: 12, fontWeight: '600' },
  choiceTextActive: { color: '#071408' },
  stepperValue: {
    minWidth: 62,
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  stepperDisabled: {
    opacity: 0.35,
  },
  modalSectionTitle: {
    color: Colors.dark.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Colors.radius.sm,
  },
  modalOptionActive: {
    backgroundColor: Colors.dark.surfaceElevated,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  modalOptionTextActive: {
    color: ACCENT,
    fontWeight: '600',
  },
  modalOptionNotes: {
    color: Colors.dark.muted,
    fontSize: 11,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: ACCENT,
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 8,
    marginHorizontal: Colors.spacing.md,
    paddingVertical: 14,
    borderRadius: Colors.radius.md,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  retakeButton: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Colors.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});
