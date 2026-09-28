import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, CARD_SHADOW } from '../constants/Colors';
import { collectionColumns } from '../constants/Layout';
import {
  useUserPreferencesStore,
  ExperienceLevel,
  TuningPreference,
} from '../features/store/userPreferencesStore';
import { useProgressStore } from '../features/store/progressStore';
import { findTuningPreset } from '../features/tuner/data/tunings';
import { LEARNING_INSTRUMENTS, learningInstrumentLabel, learningTuningId } from '../features/lessons/data/learningInstrument';

interface QuestionnaireProps {
  onComplete: () => void;
}

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; icon: string }[] = [
  { value: 'beginner', label: 'Beginner', icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', icon: '🌿' },
  { value: 'advanced', label: 'Advanced', icon: '🌳' },
];

const TUNING_OPTIONS: { value: TuningPreference; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard E', description: 'E A D G B E' },
  { value: 'drop_d', label: 'Drop D', description: 'D A D G B E' },
  { value: 'open_g', label: 'Open G', description: 'D G D G B D' },
  { value: 'open_d', label: 'Open D', description: 'D A D F# A D' },
  { value: 'dadgad', label: 'DADGAD', description: 'D A D G A D' },
];

export default function Questionnaire({ onComplete }: QuestionnaireProps) {
  const { width, fontScale } = useWindowDimensions();
  const singleColumn = collectionColumns(width, fontScale) === 1;
  const [step, setStep] = useState(0);
  const {
    guitarType,
    learningInstrument,
    setLearningInstrument,
    experienceLevel,
    tuningPreference,
    setExperienceLevel,
    setTuningPreference,
    completeQuestionnaire,
  } = useUserPreferencesStore();
  const setAlternateTuning = useProgressStore((state) => state.setAlternateTuning);

  const handleQuickStart = () => {
    setExperienceLevel('beginner');
    setTuningPreference('standard');
    setAlternateTuning(learningTuningId(learningInstrument));
    completeQuestionnaire();
    onComplete();
  };

  const handleComplete = () => {
    const preferredName: Record<TuningPreference, string> = {
      standard: 'Standard E',
      drop_d: 'Drop D',
      open_g: 'Open G',
      open_d: 'Open D',
      dadgad: 'DADGAD',
    };
    const preset = findTuningPreset(learningInstrument === 'bass' ? learningTuningId('bass') : preferredName[tuningPreference], guitarType);
    if (preset) setAlternateTuning(preset.id);
    completeQuestionnaire();
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return learningInstrument !== null;
      case 1:
        return experienceLevel !== null;
      case 2:
        return tuningPreference !== null;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.questionTitle}>What do you want to learn?</Text>
            <Text style={styles.questionSubtitle}>Choose one instrument. You can switch paths later without losing progress.</Text>
            <View style={styles.optionsGrid}>
              {LEARNING_INSTRUMENTS.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionCard,
                    singleColumn && { width: '100%' },
                    learningInstrument === type.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setLearningInstrument(type.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: learningInstrument === type.value }}
                >
                  <Text style={styles.optionIcon}>🎸</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      learningInstrument === type.value && styles.optionLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.questionTitle}>What's your experience level?</Text>
            <Text style={styles.questionSubtitle}>Save your starting point. All lessons stay available, so you can review the basics or explore later units.</Text>
            <View style={styles.optionsList}>
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.optionRow,
                    experienceLevel === level.value && styles.optionRowSelected,
                  ]}
                  onPress={() => setExperienceLevel(level.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: experienceLevel === level.value }}
                >
                  <Text style={styles.optionRowIcon}>{level.icon}</Text>
                  <Text
                    style={[
                      styles.optionRowLabel,
                      experienceLevel === level.value && styles.optionRowLabelSelected,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      case 2:
        if (learningInstrument === 'bass') return <View>
          <Text style={styles.questionTitle}>Standard four-string bass</Text>
          <Text style={styles.questionSubtitle}>This path uses E1–A1–D2–G2. Five- and six-string bass can still be tuned in the Tuner, but this course's diagrams and drills use four strings.</Text>
        </View>;
        return (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.questionTitle}>What tuning do you use?</Text>
            <Text style={styles.questionSubtitle}>The lesson drills use Standard E. Other tunings remain available in the Tuner.</Text>
            <View style={styles.optionsList}>
              {TUNING_OPTIONS.map((tuning) => (
                <TouchableOpacity
                  key={tuning.value}
                  style={[
                    styles.optionRow,
                    tuningPreference === tuning.value && styles.optionRowSelected,
                  ]}
                  onPress={() => setTuningPreference(tuning.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: tuningPreference === tuning.value }}
                >
                  <View style={styles.tuningInfo}>
                    <Text
                      style={[
                        styles.optionRowLabel,
                        tuningPreference === tuning.value && styles.optionRowLabelSelected,
                      ]}
                    >
                      {tuning.label}
                    </Text>
                    <Text style={styles.tuningDescription}>{tuning.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={styles.title}>Welcome to StandardTune!</Text>
          <Text style={styles.subtitle}>
            Start immediately with reliable beginner defaults, or personalize in three quick steps.
          </Text>
          {step === 0 && (
            <TouchableOpacity
              style={styles.quickStartButton}
              onPress={handleQuickStart}
              accessibilityRole="button"
              accessibilityLabel={`Quick start ${learningInstrumentLabel(learningInstrument)} with beginner lessons and standard tuning`}
            >
              <Text style={styles.quickStartText}>Quick Start · Beginner</Text>
              <Text style={styles.quickStartDetail}>{learningInstrumentLabel(learningInstrument)} · Standard tuning</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={styles.progressContainer}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.progressDot, i === step && styles.progressDotActive]}
            />
          ))}
        </View>

        <View style={styles.stepContainer}>{renderStep()}</View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={() => {
            if (step < 2) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={!canProceed()}
        >
          <Text style={styles.nextButtonText}>
            {step < 2 ? 'Next' : "Let's Start!"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Colors.spacing.lg,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: Colors.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: Colors.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.muted,
    textAlign: 'center',
  },
  quickStartButton: {
    alignSelf: 'stretch',
    backgroundColor: Colors.success,
    borderRadius: Colors.radius.md,
    paddingVertical: 14,
    paddingHorizontal: Colors.spacing.md,
    alignItems: 'center',
    marginTop: Colors.spacing.lg,
  },
  quickStartText: {
    color: '#071408',
    fontSize: 17,
    fontWeight: '800',
  },
  quickStartDetail: {
    color: '#123714',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Colors.spacing.sm,
    marginBottom: Colors.spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  progressDotActive: {
    backgroundColor: Colors.success,
    width: 24,
  },
  stepContainer: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Colors.spacing.sm,
  },
  questionSubtitle: {
    fontSize: 14,
    color: Colors.dark.muted,
    marginBottom: Colors.spacing.lg,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Colors.spacing.md,
    justifyContent: 'center',
  },
  optionCard: {
    width: '45%',
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.lg,
    padding: Colors.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.cardBorder,
  },
  optionCardSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: Colors.spacing.sm,
  },
  optionLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  optionLabelSelected: {
    color: Colors.success,
  },
  optionsList: {
    gap: Colors.spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.md,
    padding: Colors.spacing.md,
    borderWidth: 2,
    borderColor: Colors.dark.cardBorder,
  },
  optionRowSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  optionRowIcon: {
    fontSize: 24,
    marginRight: Colors.spacing.md,
  },
  optionRowLabel: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  optionRowLabelSelected: {
    color: Colors.success,
  },
  tuningInfo: {
    flex: 1,
  },
  tuningDescription: {
    fontSize: 14,
    color: Colors.dark.muted,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Colors.spacing.lg,
    gap: Colors.spacing.md,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Colors.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.success,
    borderRadius: Colors.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#071408',
  },
});
