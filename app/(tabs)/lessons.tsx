import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import { useProgressStore } from '../../features/store/progressStore';
import { useUserPreferencesStore } from '../../features/store/userPreferencesStore';
import Questionnaire from '../../components/Questionnaire';
import GuitarAnatomy from '../../components/GuitarAnatomy';
import { LESSON_CONTENT } from '../../features/lessons/data/lessonContent';

const TOTAL_LESSONS = 11;

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const LEVEL_COLORS: Record<Difficulty, string> = {
  beginner: Colors.success,
  intermediate: Colors.warning,
  advanced: Colors.danger,
};

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  component?: 'guitar-anatomy';
}

interface LessonCategory {
  id: string;
  label: string;
  difficulty: Difficulty;
  lessons: Lesson[];
}

const LESSON_DATA: LessonCategory[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    difficulty: 'beginner',
    lessons: [
      {
        id: 'beginner-guitar-anatomy',
        title: 'Guitar Anatomy',
        description:
          'Learn the parts of your guitar, from headstock to bridge, and understand what each part does.',
        difficulty: 'beginner',
        component: 'guitar-anatomy',
      },
      {
        id: 'beginner-basic-strumming',
        title: 'Basic Strumming',
        description:
          'Master fundamental strumming patterns using downstrokes and upstrokes with consistent rhythm.',
        difficulty: 'beginner',
      },
      {
        id: 'beginner-open-chords',
        title: 'Open Chords',
        description:
          'Play essential open chords like G, C, D, E minor, and A minor to strum your first songs.',
        difficulty: 'beginner',
      },
      {
        id: 'beginner-reading-tabs',
        title: 'Reading Tabs',
        description:
          'Understand guitar tablature notation so you can learn any song from written tabs.',
        difficulty: 'beginner',
      },
    ],
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    difficulty: 'intermediate',
    lessons: [
      {
        id: 'intermediate-barre-chords',
        title: 'Barre Chords',
        description:
          'Unlock the fretboard with movable barre chord shapes and play in any key.',
        difficulty: 'intermediate',
      },
      {
        id: 'intermediate-fingerpicking',
        title: 'Fingerpicking',
        description:
          'Develop finger independence and learn classic fingerpicking patterns for acoustic guitar.',
        difficulty: 'intermediate',
      },
      {
        id: 'intermediate-scales-101',
        title: 'Scales 101',
        description:
          'Learn the major and minor scales to understand melody construction and soloing foundations.',
        difficulty: 'intermediate',
      },
      {
        id: 'intermediate-music-theory',
        title: 'Music Theory',
        description:
          'Explore chord progressions, keys, intervals, and how music is structured.',
        difficulty: 'intermediate',
      },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    difficulty: 'advanced',
    lessons: [
      {
        id: 'advanced-improvisation',
        title: 'Improvisation',
        description:
          'Express yourself freely by learning how to improvise solos over backing tracks.',
        difficulty: 'advanced',
      },
      {
        id: 'advanced-techniques',
        title: 'Advanced Techniques',
        description:
          'Master hammer-ons, pull-offs, slides, bends, vibrato, and tapping.',
        difficulty: 'advanced',
      },
      {
        id: 'advanced-songwriting',
        title: 'Songwriting',
        description:
          'Combine your skills to write original songs with compelling chord progressions and melodies.',
        difficulty: 'advanced',
      },
    ],
  },
];

function DifficultyDot({ difficulty }: { difficulty: Difficulty }) {
  return (
    <View
      style={[styles.dot, { backgroundColor: LEVEL_COLORS[difficulty] }]}
      accessibilityLabel={`Difficulty: ${difficulty}`}
    />
  );
}

function ProgressOverview({
  completedCount,
  totalLessons,
  progressPercent,
}: {
  completedCount: number;
  totalLessons: number;
  progressPercent: number;
}) {
  const animWidth = useSharedValue(0);
  const derivedStyle = useAnimatedStyle(() => ({
    width: `${animWidth.value}%`,
  }));

  useEffect(() => {
    animWidth.value = withTiming(progressPercent, { duration: 800 });
  }, [progressPercent]);

  return (
    <View style={[styles.card, CARD_SHADOW]}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Your Progress</Text>
        <Text style={styles.progressCount}>
          {completedCount}/{totalLessons} lessons
        </Text>
      </View>
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, derivedStyle]} />
      </View>
      <Text style={styles.progressHint}>
        {completedCount === totalLessons
          ? 'All lessons complete — you rock!'
          : `${totalLessons - completedCount} lesson${totalLessons - completedCount === 1 ? '' : 's'} remaining`}
      </Text>
    </View>
  );
}

function CategorySection({
  category,
  isExpanded,
  onToggle,
  isLessonCompleted,
  onLessonTap,
}: {
  category: LessonCategory;
  isExpanded: boolean;
  onToggle: () => void;
  isLessonCompleted: (id: string) => boolean;
  onLessonTap: (lesson: Lesson) => void;
}) {
  const completedInCategory = category.lessons.filter((l) =>
    isLessonCompleted(l.id),
  ).length;

  return (
    <View style={styles.categoryContainer}>
      <PressableScale
        onPress={onToggle}
        style={[styles.categoryHeader, { borderLeftColor: LEVEL_COLORS[category.difficulty] }]}
        accessibilityLabel={`${category.label} lessons, ${completedInCategory} of ${category.lessons.length} completed. ${isExpanded ? 'Tap to collapse' : 'Tap to expand'}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.categoryHeaderLeft}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <Text style={styles.categoryCount}>
            {completedInCategory}/{category.lessons.length}
          </Text>
        </View>
        <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>
      </PressableScale>

      {isExpanded && (
        <View style={styles.lessonList}>
          {category.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              completed={isLessonCompleted(lesson.id)}
              onPress={() => onLessonTap(lesson)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function LessonCard({
  lesson,
  completed,
  onPress,
}: {
  lesson: Lesson;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.lessonCard, completed && styles.lessonCardCompleted]}
      accessibilityLabel={`${lesson.title}. ${lesson.description}. Difficulty: ${lesson.difficulty}. ${completed ? 'Completed' : 'Not completed'}`}
      accessibilityRole="button"
    >
      <View style={styles.lessonCardTop}>
        <DifficultyDot difficulty={lesson.difficulty} />
        <Text style={styles.lessonTitle} numberOfLines={1}>
          {lesson.title}
        </Text>
        {completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.lessonDescription} numberOfLines={2}>
        {lesson.description}
      </Text>
    </PressableScale>
  );
}

function LessonDetail({
  lesson,
  completed,
  onClose,
  onComplete,
}: {
  lesson: Lesson;
  completed: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const sections = LESSON_CONTENT[lesson.id] ?? [];

  return (
    <View style={[styles.detailOverlay, styles.detailContainer]}>
      <View style={[styles.detailCard, CARD_SHADOW]}>
        <ScrollView
          style={styles.detailScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailHeader}>
            <DifficultyDot difficulty={lesson.difficulty} />
            <Text style={styles.detailDifficulty}>
              {lesson.difficulty.charAt(0).toUpperCase() + lesson.difficulty.slice(1)}
            </Text>
            {completed && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            )}
          </View>

          <Text style={styles.detailTitle}>{lesson.title}</Text>
          <Text style={styles.detailDescription}>{lesson.description}</Text>

          {sections.map((section, i) => (
            <View key={section.heading} style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>
                {i + 1}. {section.heading}
              </Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          <PressableScale
            onPress={onComplete}
            style={[styles.startButton, completed && styles.startButtonAgain]}
            accessibilityLabel={
              completed ? 'Mark lesson complete again' : 'Mark lesson as complete'
            }
          >
            <Text style={styles.startButtonText}>
              {completed ? 'Mark Complete Again' : 'Mark as Complete'}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close lesson detail"
          >
            <Text style={styles.closeButtonText}>Back to Lessons</Text>
          </PressableScale>
        </ScrollView>
      </View>
    </View>
  );
}

function GuitarAnatomyLessonContent({
  onQuizPassed,
}: {
  onQuizPassed: (scorePercent: number) => void;
}) {
  const { guitarType } = useUserPreferencesStore();
  return <GuitarAnatomy guitarType={guitarType} onQuizPassed={onQuizPassed} />;
}

export default function LessonsScreen() {
  const { completedLessons, completeLesson, isLessonCompleted } =
    useProgressStore();
  const {
    hasCompletedQuestionnaire,
    hasHydrated,
    resetQuestionnaire,
  } = useUserPreferencesStore();

  // Derived from the store so "Retake Questionnaire" (here or in Settings)
  // works even while this tab stays mounted.
  const showQuestionnaire = hasHydrated && !hasCompletedQuestionnaire;

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['beginner']),
  );
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeLessonContent, setActiveLessonContent] = useState<string | null>(null);

  const completedCount = useMemo(
    () => Object.values(completedLessons).filter((l) => l.completed).length,
    [completedLessons],
  );

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleLessonTap = useCallback((lesson: Lesson) => {
    if (lesson.component === 'guitar-anatomy') {
      setActiveLessonContent('guitar-anatomy');
    } else {
      setSelectedLesson(lesson);
    }
  }, []);

  const handleLessonComplete = useCallback(() => {
    if (selectedLesson) {
      completeLesson(selectedLesson.id, 100);
      setSelectedLesson(null);
    }
  }, [selectedLesson, completeLesson]);

  const handleCloseDetail = useCallback(() => {
    setSelectedLesson(null);
  }, []);

  const handleCloseLessonContent = useCallback(() => {
    setActiveLessonContent(null);
  }, []);

  const handleAnatomyQuizPassed = useCallback(
    (scorePercent: number) => {
      completeLesson('beginner-guitar-anatomy', scorePercent);
    },
    [completeLesson],
  );

  // The Questionnaire component flips hasCompletedQuestionnaire in the store
  // itself, which hides it here - onComplete needs no extra work.
  const handleQuestionnaireComplete = useCallback(() => {}, []);

  const handleRetakeQuestionnaire = useCallback(() => {
    resetQuestionnaire();
  }, [resetQuestionnaire]);

  // Wait for AsyncStorage rehydration so returning users don't see a
  // flash of the questionnaire on cold start.
  if (!hasHydrated) {
    return <View style={styles.screen} />;
  }

  if (showQuestionnaire) {
    return <Questionnaire onComplete={handleQuestionnaireComplete} />;
  }

  if (activeLessonContent === 'guitar-anatomy') {
    return (
      <View style={styles.screen}>
        <View style={styles.lessonHeader}>
          <TouchableOpacity
            style={styles.lessonBackButton}
            onPress={handleCloseLessonContent}
          >
            <Text style={styles.lessonBackButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.lessonHeaderTitle}>Guitar Anatomy</Text>
          {isLessonCompleted('beginner-guitar-anatomy') && (
            <Text style={styles.lessonHeaderDone}>✓</Text>
          )}
        </View>
        <GuitarAnatomyLessonContent onQuizPassed={handleAnatomyQuizPassed} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.header}>Guitar Lessons</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleRetakeQuestionnaire}
            accessibilityLabel="Retake questionnaire"
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ProgressOverview
          completedCount={completedCount}
          totalLessons={TOTAL_LESSONS}
          progressPercent={(completedCount / TOTAL_LESSONS) * 100}
        />

        {LESSON_DATA.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            isExpanded={expandedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            isLessonCompleted={isLessonCompleted}
            onLessonTap={handleLessonTap}
          />
        ))}
      </ScrollView>

      {selectedLesson && (
        <LessonDetail
          lesson={selectedLesson}
          completed={isLessonCompleted(selectedLesson.id)}
          onClose={handleCloseDetail}
          onComplete={handleLessonComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Colors.spacing.lg,
    paddingBottom: Colors.spacing.xxl * 2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Colors.spacing.lg,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  settingsButton: {
    padding: Colors.spacing.sm,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.lg,
    padding: Colors.spacing.lg,
    marginBottom: Colors.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Colors.spacing.sm,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Colors.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 13,
    color: Colors.dark.muted,
  },
  categoryContainer: {
    marginBottom: Colors.spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.md,
    paddingVertical: Colors.spacing.md,
    paddingHorizontal: Colors.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.muted,
  },
  chevron: {
    fontSize: 18,
    color: Colors.dark.muted,
  },
  lessonList: {
    marginTop: Colors.spacing.sm,
    gap: Colors.spacing.sm,
  },
  lessonCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Colors.radius.md,
    padding: Colors.spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  lessonCardCompleted: {
    borderColor: Colors.success,
    opacity: 0.85,
  },
  lessonCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.text,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
  lessonDescription: {
    fontSize: 13,
    color: Colors.dark.muted,
    lineHeight: 18,
  },
  detailOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  detailCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Colors.radius.xl,
    padding: Colors.spacing.xl,
    marginHorizontal: Colors.spacing.lg,
    width: '92%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  detailScroll: {
    flexGrow: 0,
  },
  sectionBlock: {
    marginBottom: Colors.spacing.md,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 14,
    color: Colors.dark.muted,
    lineHeight: 21,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Colors.spacing.md,
  },
  detailDifficulty: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.muted,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: Colors.spacing.sm,
  },
  detailDescription: {
    fontSize: 15,
    color: Colors.dark.muted,
    lineHeight: 22,
    marginBottom: Colors.spacing.lg,
  },
  completedBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.success,
    borderRadius: Colors.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  completedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  startButton: {
    backgroundColor: Colors.success,
    borderRadius: Colors.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Colors.spacing.sm,
  },
  startButtonAgain: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.muted,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Colors.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
  },
  lessonBackButton: {
    marginRight: Colors.spacing.md,
  },
  lessonBackButtonText: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: '600',
  },
  lessonHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  lessonHeaderDone: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.success,
    marginLeft: 'auto',
  },
});
