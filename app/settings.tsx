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
import { Colors, CARD_SHADOW } from '../constants/Colors';
import PressableScale from '../components/PressableScale';
import { useProgressStore } from '../features/store/progressStore';
import { minutesFrom } from '../features/practice/streak';
import * as Linking from 'expo-linking';
import { useUserPreferencesStore } from '../features/store/userPreferencesStore';
import { useSettingsStore } from '../features/store/settingsStore';
import { TUNING_PRESETS } from '../features/tuner/data/tunings';

const ACCENT = Colors.success;

/** 95 -> "1h 35m", 40 -> "40m". */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
const UNIQUE_TUNING_NAMES = [...new Set(TUNING_PRESETS.map((p) => p.name))];

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
  accessibilityLabel,
}: {
  label: string;
  right: React.ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <View
      style={styles.row}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
    >
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

function TuningPicker({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (name: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <PressableScale
        onPress={() => setVisible(true)}
        style={styles.pickerButton}
        accessibilityLabel={`Tuning: ${current}. Tap to change`}
        accessibilityRole="button"
      >
        <Text style={styles.pickerButtonText}>{current}</Text>
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
              {UNIQUE_TUNING_NAMES.map((name) => (
                <PressableScale
                  key={name}
                  onPress={() => {
                    onSelect(name);
                    setVisible(false);
                  }}
                  style={[
                    styles.modalOption,
                    name === current && styles.modalOptionActive,
                  ]}
                  accessibilityLabel={`${name}${name === current ? ' (current)' : ''}`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      name === current && styles.modalOptionTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                  {name === current && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </PressableScale>
              ))}
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

  const {
    soundsEnabled,
    sampleVolume,
    practiceGoalMinutes,
    setSoundsEnabled,
    setSampleVolume,
    setPracticeGoalMinutes,
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
            accessibilityLabel={`Current tuning: ${alternateTuning}`}
            right={
              <TuningPicker
                current={alternateTuning}
                onSelect={setAlternateTuning}
              />
            }
          />
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
            label="App Name"
            accessibilityLabel="App name: StandardTune"
            right={<Text style={styles.rowValue}>StandardTune</Text>}
          />
          <SettingRow
            label="Version"
            accessibilityLabel="App version: 1.0.0"
            right={<Text style={styles.rowValue}>1.0.0</Text>}
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
    height: 40,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
