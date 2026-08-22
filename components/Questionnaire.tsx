import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, CARD_SHADOW } from '../constants/Colors';
import {
  useUserPreferencesStore,
  GuitarType,
  ExperienceLevel,
  TuningPreference,
} from '../features/store/userPreferencesStore';

interface QuestionnaireProps {
  onComplete: () => void;
}

const GUITAR_TYPES: { value: GuitarType; label: string; icon: string }[] = [
  { value: 'acoustic', label: 'Acoustic', icon: '🎸' },
  { value: 'electric', label: 'Electric', icon: '🎸' },
  { value: 'classical', label: 'Classical', icon: '🎸' },
];

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
  const [step, setStep] = useState(0);
  const {
    guitarType,
    experienceLevel,
    tuningPreference,
    setGuitarType,
    setExperienceLevel,
    setTuningPreference,
    completeQuestionnaire,
  } = useUserPreferencesStore();

  const handleComplete = () => {
    completeQuestionnaire();
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return guitarType !== null;
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
            <Text style={styles.questionTitle}>What type of guitar do you have?</Text>
            <Text style={styles.questionSubtitle}>This helps us show you the right parts</Text>
            <View style={styles.optionsGrid}>
              {GUITAR_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionCard,
                    guitarType === type.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setGuitarType(type.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: guitarType === type.value }}
                >
                  <Text style={styles.optionIcon}>{type.icon}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      guitarType === type.value && styles.optionLabelSelected,
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
            <Text style={styles.questionSubtitle}>This helps us adjust lesson detail</Text>
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
        return (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.questionTitle}>What tuning do you use?</Text>
            <Text style={styles.questionSubtitle}>Most beginners start with Standard E</Text>
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
            Let's personalize your experience
          </Text>
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
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
