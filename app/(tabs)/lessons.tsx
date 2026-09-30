import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useIsFocused } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '../../constants/Layout';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import { useProgressStore } from '../../features/store/progressStore';
import { useSettingsStore } from '../../features/store/settingsStore';
import { minutesFrom } from '../../features/practice/streak';
import { useUserPreferencesStore } from '../../features/store/userPreferencesStore';
import Questionnaire from '../../components/Questionnaire';
import GuitarAnatomy from '../../components/GuitarAnatomy';
import ChordDiagramLesson from '../../components/ChordDiagramLesson';
import { LESSON_CONTENT } from '../../features/lessons/data/lessonContent';
import { LESSON_SUMMARIES } from '../../features/lessons/data/lessonSummaries';
import { getDrill } from '../../features/lessons/data/drills';
import PlayAlongLesson from '../../features/lessons/playalong/PlayAlongLesson';
import ChoiceChips from '../../components/ChoiceChips';
import ChordDiagram from '../../components/ChordDiagram';
import { getChord } from '../../features/chords/data/chords';
import { curriculumFor, curriculumProgress, type GuidedLesson as Lesson, type CurriculumUnit as LessonCategory } from '../../features/lessons/data/curriculum';
import { LEARNING_INSTRUMENTS, learningInstrumentLabel, learningTuningId, type LearningInstrument } from '../../features/lessons/data/learningInstrument';
import StaffPrimer from '../../features/lessons/StaffPrimer';


type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const LEVEL_COLORS: Record<Difficulty, string> = {
  beginner: Colors.success,
  intermediate: Colors.warning,
  advanced: Colors.danger,
};

type MCIName = keyof typeof MaterialCommunityIcons.glyphMap;

const LESSON_ICONS: Record<string, MCIName> = {
  'beginner-guitar-anatomy': 'guitar-acoustic',
  'beginner-basic-strumming': 'guitar-pick',
  'beginner-open-chords': 'music-clef-treble',
  'beginner-reading-tabs': 'file-music',
  'intermediate-barre-chords': 'guitar-electric',
  'intermediate-fingerpicking': 'gesture-tap',
  'intermediate-scales-101': 'stairs',
  'intermediate-music-theory': 'book-open-variant',
  'advanced-improvisation': 'lightning-bolt',
  'advanced-techniques': 'fire',
  'advanced-songwriting': 'playlist-edit',
  'bass-first-notes': 'guitar-electric',
  'bass-right-hand': 'gesture-tap',
  'bass-fretboard': 'music-note',
  'bass-groove': 'metronome',
  'music-pulse': 'metronome',
  'music-listening': 'ear-hearing',
  'music-practice': 'calendar-check',
  'beginner-two-chords': 'music-clef-treble',
  'electric-setup': 'volume-high',
  'electric-power-chords': 'guitar-electric',
  'classical-posture': 'account',
  'classical-first-touch': 'gesture-tap',
  'classical-reading-music': 'music-clef-treble',
  'bass-reading-tabs': 'file-music',
  'bass-clean-notes': 'music-note',
  'bass-roots-fifths': 'music-note-plus',
  'bass-reading-music': 'music-clef-bass',
};

const FALLBACK_ICON: MCIName = 'music-note';


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
        <Text style={styles.progressTitle}>This learning path</Text>
        <Text style={styles.progressCount}>
          {completedCount}/{totalLessons} lessons
        </Text>
      </View>
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, derivedStyle]} />
      </View>
      <Text style={styles.progressHint}>
        {completedCount === totalLessons
          ? 'Path complete. Revisit any lesson and keep making music.'
          : `${totalLessons - completedCount} lesson${totalLessons - completedCount === 1 ? '' : 's'} remaining`}
      </Text>
      <PracticeToday />
    </View>
  );
}

/**
 * Time at the instrument today, against the goal set in Settings. Counts
 * the tuner, the metronome and the drills — not time spent reading.
 */
function PracticeToday() {
  const practiceLog = useProgressStore((s) => s.practiceLog);
  const practiceSecondsToday = useProgressStore((s) => s.practiceSecondsToday);
  const liveStreak = useProgressStore((s) => s.liveStreak);
  const goal = useSettingsStore((s) => s.practiceGoalMinutes);
  void practiceLog; // subscribe, so a logged session re-renders this

  const minutes = minutesFrom(practiceSecondsToday());
  const streak = liveStreak();
  const fraction = goal > 0 ? Math.min(1, minutes / goal) : 0;

  return (
    <View style={styles.practiceRow}>
      <View style={styles.practiceBarTrack}>
        <View style={[styles.practiceBarFill, { width: `${fraction * 100}%` }]} />
      </View>
      <Text style={styles.practiceText}>
        {minutes >= goal
          ? `${minutes}m today · goal met`
          : `${minutes}/${goal}m today`}
        {streak > 1 ? ` · ${streak}-day streak` : ''}
      </Text>
    </View>
  );
}

function CategorySection({
  category,
  isExpanded,
  onToggle,
  isLessonCompleted,
  getLessonScore,
  onLessonTap,
}: {
  category: LessonCategory;
  isExpanded: boolean;
  onToggle: () => void;
  isLessonCompleted: (id: string) => boolean;
  getLessonScore: (id: string) => number;
  onLessonTap: (lesson: Lesson) => void;
}) {
  const completedInCategory = category.lessons.filter((l) =>
    isLessonCompleted(l.id),
  ).length;

  return (
    <View style={styles.categoryContainer}>
      <PressableScale
        onPress={onToggle}
        style={styles.categoryHeader}
        accessibilityLabel={`${category.label} lessons, ${completedInCategory} of ${category.lessons.length} completed. ${isExpanded ? 'Tap to collapse' : 'Tap to expand'}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View
          style={[
            styles.categoryDot,
            { backgroundColor: LEVEL_COLORS[category.difficulty] },
          ]}
        />
        <Text style={styles.categoryLabel}>{category.label}</Text>
        <View style={styles.categoryRule} />
        <Text style={styles.categoryCount}>
          {completedInCategory}/{category.lessons.length}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
          size={15}
          color={Colors.dark.muted}
        />
      </PressableScale>

      {isExpanded && (
        <View style={styles.lessonList}>
          {category.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              completed={isLessonCompleted(lesson.id)}
              score={getLessonScore(lesson.id)}
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
  score,
  onPress,
}: {
  lesson: Lesson;
  completed: boolean;
  score: number;
  onPress: () => void;
}) {
  const levelColor = LEVEL_COLORS[lesson.difficulty];
  // A drill scores what you actually played; "Mark as Complete" stores 100.
  // Only the former is worth showing back.
  const showScore = completed && score > 0 && score < 100;
  const summary = (LESSON_SUMMARIES[lesson.id] ?? lesson.description).replace(/\.+$/, '');

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.lessonCard, completed && styles.lessonCardCompleted]}
      accessibilityLabel={`${lesson.title}. ${summary}. Difficulty: ${lesson.difficulty}. ${
        completed ? `Completed${showScore ? `, best score ${score} percent` : ''}` : 'Not completed'
      }`}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.lessonIconTile,
          {
            backgroundColor: `${levelColor}1F`,
            borderColor: `${levelColor}40`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={LESSON_ICONS[lesson.id] ?? FALLBACK_ICON}
          size={24}
          color={levelColor}
        />
      </View>
      <View style={styles.lessonBody}>
        <Text style={styles.lessonTitle}>
          {lesson.title}
        </Text>
        <Text style={styles.lessonDescription}>
          {LESSON_SUMMARIES[lesson.id] ?? lesson.description}
        </Text>
        <Text style={styles.lessonDescription}>{lesson.minutes} min practice idea</Text>
      </View>
      {completed ? (
        <View style={styles.lessonTrailing}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          {showScore && <Text style={styles.lessonScore}>{score}%</Text>}
        </View>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.dark.muted}
          style={styles.lessonTrailing}
        />
      )}
    </PressableScale>
  );
}

function LessonDetail({
  lesson,
  completed,
  onClose,
  onComplete,
  onPractice,
  instrument,
  onTune,
}: {
  lesson: Lesson;
  completed: boolean;
  onClose: () => void;
  onComplete: () => void;
  onPractice: (() => void) | null;
  instrument: LearningInstrument;
  onTune: () => void;
}) {
  const sections = LESSON_CONTENT[lesson.id] ?? [];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <View style={[styles.detailOverlay, styles.detailContainer]}>
      <View style={[styles.detailCard, CARD_SHADOW]} accessibilityViewIsModal>
        <View style={styles.detailToolbar}>
          <Text style={styles.sectionHeading}>Lesson</Text>
          <TouchableOpacity onPress={onClose} style={styles.detailClose} accessibilityRole="button" accessibilityLabel="Close lesson detail">
            <Ionicons name="close" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>
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
          <Text style={styles.sectionHeading}>Your aim</Text>
          <Text style={styles.sectionBody}>{lesson.outcome}</Text>
          <Text style={styles.pathNote}>{learningInstrumentLabel(instrument)} · standard tuning · no deadline</Text>
          <PressableScale onPress={onTune} style={styles.closeButton} accessibilityRole="button">
            <Text style={styles.closeButtonText}>Tune for this path</Text>
          </PressableScale>
          {(lesson.id === 'classical-reading-music' || lesson.id === 'bass-reading-music') && <StaffPrimer clef={instrument === 'bass' ? 'bass' : 'treble'} />}
          {lesson.id === 'beginner-two-chords' && <View style={styles.chordPair}>
            {['Em', 'Am'].map(name => <View key={name} style={styles.chordPreview}>
              <Text style={styles.sectionHeading}>{name}</Text>
              <ChordDiagram chord={getChord(name)!} />
            </View>)}
          </View>}

          {sections.map((section, i) => (
            <View key={section.heading} style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>
                {i + 1}. {section.heading}
              </Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
          <View style={styles.practicePlan}>
            <Text style={styles.sectionHeading}>Try it · about {lesson.minutes} minutes</Text>
            <Text style={styles.sectionBody}>{lesson.practice}</Text>
            <Text style={styles.sectionHeading}>Ready for the next step?</Text>
            <Text style={styles.sectionBody}>{lesson.readyWhen}</Text>
            <Text style={styles.pathNote}>Repeat whenever useful. Completion records practice, not certified mastery.</Text>
          </View>

          {onPractice && (
            <PressableScale
              onPress={onPractice}
              style={styles.practiceButton}
              accessibilityLabel={`Practice this lesson on ${learningInstrumentLabel(instrument)}`}
            >
              <Ionicons name="mic-outline" size={18} color="#fff" />
              <Text style={styles.startButtonText}>Try the listening drill</Text>
            </PressableScale>
          )}
          <PressableScale
            onPress={onComplete}
            style={[styles.startButton, completed && styles.startButtonAgain]}
            accessibilityLabel={
              completed ? 'Mark lesson complete again' : 'Mark lesson as complete'
            }
          >
            <Text style={[styles.startButtonText, !completed && styles.successButtonText]}>
              {completed ? 'Finish review' : 'I practised this lesson'}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Back to lessons"
          >
            <Text style={styles.closeButtonText}>Back to Lessons</Text>
          </PressableScale>
        </ScrollView>
      </View>
    </View>
    </Modal>
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
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { completedLessons, completeLesson, isLessonCompleted, getLessonScore } =
    useProgressStore();
  const {
    hasCompletedQuestionnaire,
    hasHydrated,
    learningInstrument,
    setLearningInstrument,
  } = useUserPreferencesStore();
  const setAlternateTuning = useProgressStore(state => state.setAlternateTuning);
  const units = useMemo(() => curriculumFor(learningInstrument), [learningInstrument]);
  const pathProgress = useMemo(() => curriculumProgress(learningInstrument, completedLessons), [learningInstrument, completedLessons]);
  const [choosingInstrument, setChoosingInstrument] = useState(false);

  // Derived from the store so "Retake Questionnaire" (here or in Settings)
  // works even while this tab stays mounted.
  const router = useRouter();
  const showQuestionnaire = hasHydrated && !hasCompletedQuestionnaire;

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set<string>(),
  );
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeLessonContent, setActiveLessonContent] = useState<string | null>(null);
  const [practiceLesson, setPracticeLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!focused || (!activeLessonContent && !practiceLesson)) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveLessonContent(null); setPracticeLesson(null); return true;
    });
    return () => subscription.remove();
  }, [focused, activeLessonContent, practiceLesson]);

  useEffect(() => {
    if (!hasCompletedQuestionnaire) return;
    const nextUnit = units.find(unit => unit.lessons.some(lesson => !completedLessons[lesson.id]?.completed)) ?? units[0];
    setExpandedCategories(new Set([nextUnit.id]));
    setSelectedLesson(null); setActiveLessonContent(null); setPracticeLesson(null);
  }, [learningInstrument, hasCompletedQuestionnaire]);

  const handleTune = () => {
    setSelectedLesson(null);
    setAlternateTuning(learningTuningId(learningInstrument));
    router.push('/');
  };

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
    if (lesson.component) {
      setActiveLessonContent(lesson.component);
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

  const handleStartPractice = useCallback(() => {
    if (selectedLesson) {
      setPracticeLesson(selectedLesson);
      setSelectedLesson(null);
    }
  }, [selectedLesson]);

  const handlePracticeComplete = useCallback(
    (scorePercent: number) => {
      if (practiceLesson) {
        completeLesson(practiceLesson.id, scorePercent);
      }
    },
    [practiceLesson, completeLesson],
  );

  const handleAnatomyQuizPassed = useCallback(
    (scorePercent: number) => {
      completeLesson('beginner-guitar-anatomy', scorePercent);
    },
    [completeLesson],
  );

  const handleDiagramQuizPassed = useCallback(
    (scorePercent: number) => {
      completeLesson('beginner-reading-diagrams', scorePercent);
    },
    [completeLesson],
  );

  // The Questionnaire component flips hasCompletedQuestionnaire in the store
  // itself, which hides it here - onComplete needs no extra work.
  const handleQuestionnaireComplete = useCallback(() => {}, []);

  // A gear icon means settings everywhere else in the app, and Settings
  // already offers "Retake Questionnaire" behind a label. Wiring the gear
  // straight to a reset threw away the player's answers on a single stray
  // tap, with nothing to confirm and no way back.
  const handleOpenSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // Wait for AsyncStorage rehydration so returning users don't see a
  // flash of the questionnaire on cold start.
  if (!hasHydrated) {
    return <View style={styles.screen} />;
  }

  if (showQuestionnaire) {
    return <Questionnaire onComplete={handleQuestionnaireComplete} />;
  }

  if (practiceLesson) {
    const drill = getDrill(practiceLesson.id);
    if (drill) {
      return (
        <PlayAlongLesson
          drill={drill}
          onClose={() => setPracticeLesson(null)}
          onComplete={handlePracticeComplete}
        />
      );
    }
  }

  if (activeLessonContent === 'guitar-anatomy') {
    return (
      <View style={styles.screen}>
        <View style={[styles.lessonHeader, { paddingTop: insets.top + 8 }]}>
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

  if (activeLessonContent === 'chord-diagrams') {
    return (
      <View style={styles.screen}>
        <View style={[styles.lessonHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.lessonBackButton}
            onPress={handleCloseLessonContent}
            accessibilityRole="button"
            accessibilityLabel="Back to lessons"
          >
            <Text style={styles.lessonBackButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.lessonHeaderTitle}>Reading Chord Diagrams</Text>
          {isLessonCompleted('beginner-reading-diagrams') && (
            <Text style={styles.lessonHeaderDone}>✓</Text>
          )}
        </View>
        <ChordDiagramLesson onQuizPassed={handleDiagramQuizPassed} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.header}>Learn</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={22} color={Colors.dark.muted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, CARD_SHADOW]}>
          <Text style={styles.progressTitle}>{learningInstrumentLabel(learningInstrument)}</Text>
          <Text style={styles.pathNote}>{learningInstrument === 'bass' ? 'Four strings · E1–A1–D2–G2' : 'Six strings · E2–A2–D3–G3–B3–E4'}</Text>
          <PressableScale style={styles.closeButton} onPress={() => setChoosingInstrument(value => !value)} accessibilityRole="button" accessibilityState={{ expanded: choosingInstrument }}>
            <Text style={styles.closeButtonText}>{choosingInstrument ? 'Close instrument choices' : 'Change learning instrument'}</Text>
          </PressableScale>
          {choosingInstrument && <>
            <ChoiceChips label="Learning instrument" value={learningInstrument} options={LEARNING_INSTRUMENTS} onChange={value => { setLearningInstrument(value); setChoosingInstrument(false); }} />
            <Text style={styles.pathNote}>One path at a time. Your saved progress stays; shared foundations carry over. Other instruments remain available in the tuner.</Text>
          </>}
          <PressableScale style={styles.closeButton} onPress={handleTune} accessibilityRole="button"><Text style={styles.closeButtonText}>Tune for this path</Text></PressableScale>
        </View>

        <ProgressOverview
          completedCount={pathProgress.completed}
          totalLessons={pathProgress.total}
          progressPercent={(pathProgress.completed / pathProgress.total) * 100}
        />

        {pathProgress.next && <View style={[styles.card, CARD_SHADOW]}>
          <Text style={styles.pathNote}>{pathProgress.completed ? 'NEXT SMALL STEP' : 'START HERE'}</Text>
          <Text style={styles.progressTitle}>{pathProgress.next.title}</Text>
          <Text style={styles.pathNote}>{pathProgress.next.outcome}</Text>
          <PressableScale style={styles.startButton} accessibilityRole="button" onPress={() => handleLessonTap(pathProgress.next!)}>
            <Text style={[styles.startButtonText, styles.successButtonText]}>Open lesson · {pathProgress.next.minutes} min practice</Text>
          </PressableScale>
        </View>}
        <Text style={styles.pathNote}>Suggested order, not locked levels. Open any unit to review or explore. Practice time is shared across the app.</Text>

        {units.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            isExpanded={expandedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            isLessonCompleted={isLessonCompleted}
            getLessonScore={getLessonScore}
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
          onPractice={getDrill(selectedLesson.id) ? handleStartPractice : null}
          instrument={learningInstrument}
          onTune={handleTune}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pathNote: { color: Colors.dark.muted, fontSize: 14, lineHeight: 21, marginVertical: 8 },
  practicePlan: { backgroundColor: Colors.dark.surfaceElevated, padding: 12, borderRadius: 12, gap: 8, marginVertical: 16 },
  chordPair: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  chordPreview: { alignItems: 'center', minWidth: 130 },
  screen: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%', maxWidth: Layout.readingWidth, alignSelf: 'center',
    padding: Layout.page,
    paddingBottom: Colors.spacing.xxl * 2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Colors.spacing.lg,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  settingsButton: {
    minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center',
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
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
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
  practiceRow: {
    marginTop: 14,
    gap: 6,
  },
  practiceBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.surfaceElevated,
    overflow: 'hidden',
  },
  practiceBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.warning,
  },
  practiceText: {
    fontSize: 12,
    color: Colors.dark.muted,
    fontWeight: '600',
  },
  progressHint: {
    fontSize: 13,
    color: Colors.dark.muted,
  },
  categoryContainer: {
    marginBottom: Colors.spacing.lg,
  },
  categoryHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Colors.spacing.sm,
    paddingHorizontal: 2,
    marginTop: Colors.spacing.xs,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Colors.spacing.sm,
  },
  categoryLabel: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark.text,
    letterSpacing: 0.2,
  },
  categoryRule: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.cardBorder,
    marginHorizontal: Colors.spacing.md,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.muted,
    marginRight: 6,
  },
  lessonList: {
    marginTop: Colors.spacing.sm,
    gap: Colors.spacing.sm,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232345',
    borderRadius: Colors.radius.md,
    paddingVertical: Colors.spacing.md - 2,
    paddingLeft: Colors.spacing.md - 2,
    paddingRight: Colors.spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  lessonCardCompleted: {
    borderColor: `${Colors.success}66`,
    opacity: 0.9,
  },
  lessonIconTile: {
    width: 44,
    height: 44,
    borderRadius: Colors.radius.md - 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Colors.spacing.md - 4,
  },
  lessonBody: {
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  lessonDescription: {
    fontSize: 14,
    color: Colors.dark.muted,
    lineHeight: 21,
  },
  lessonScore: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
  },
  lessonTrailing: {
    marginLeft: Colors.spacing.sm,
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
    flexShrink: 1,
  },
  detailToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  detailClose: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
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
    flexWrap: 'wrap',
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
    color: '#071408',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    borderRadius: Colors.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: Colors.spacing.sm,
  },
  startButton: {
    backgroundColor: Colors.success,
    borderRadius: Colors.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: Colors.spacing.sm,
  },
  startButtonAgain: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  startButtonText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  successButtonText: {
    color: '#071408',
  },
  closeButton: {
    minHeight: 48,
    justifyContent: 'center',
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
  },
  lessonBackButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    marginRight: Colors.spacing.md,
  },
  lessonBackButtonText: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: '600',
  },
  lessonHeaderTitle: {
    flexShrink: 1,
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
