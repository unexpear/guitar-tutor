import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_SHADOW, Colors } from '../constants/Colors';
import { getChord } from '../features/chords/data/chords';
import {
  CHORD_DIAGRAM_QUIZ,
  FRETTING_FINGER_NAMES,
} from '../features/chords/data/diagramGuide';
import { useSettingsStore } from '../features/store/settingsStore';
import ChordDiagram from './ChordDiagram';
import PressableScale from './PressableScale';

const PASS_SCORE = 4;

interface GuideStep {
  title: string;
  chordName: string;
  eyebrow: string;
  body: (leftHanded: boolean) => string;
  action: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Hold the map upright',
    chordName: 'Em',
    eyebrow: '1 · STRINGS',
    body: (leftHanded) =>
      `The six upright lines are your six strings as if you faced the fretboard. In your ${leftHanded ? 'left-handed' : 'right-handed'} view, the thick low E is on the ${leftHanded ? 'right' : 'left'} and the thin high e is on the ${leftHanded ? 'left' : 'right'}. The letters underneath are the safest way to check.`,
    action: 'Find the thick low E on your guitar, then match it to the E under the diagram.',
  },
  {
    title: 'Read the top first',
    chordName: 'A',
    eyebrow: '2 · OPEN OR SILENT',
    body: () =>
      'A circle ○ means play the string open, with no finger on it. A cross × means keep that string silent. These shapes and words carry the meaning—not color alone.',
    action: 'For A, skip the low E marked ×. Begin your strum on the open A marked ○.',
  },
  {
    title: 'Place the numbered fingertips',
    chordName: 'C',
    eyebrow: '3 · FINGERS + FRETS',
    body: () =>
      'A numbered dot tells you both where and what to press. The row is the fret; the number is your fretting finger. Put the fingertip in the space just behind the metal fret—not on the metal line.',
    action: 'For C: finger 1 goes on B fret 1, finger 2 on D fret 2, and finger 3 on A fret 3.',
  },
  {
    title: 'Follow the real fret numbers',
    chordName: 'Ab',
    eyebrow: '4 · UP THE NECK',
    body: () =>
      'The numbers down the side name the actual frets. Near the headstock, the thick top bar is the nut and the first row is fret 1. Farther up the neck, the diagram slides to the frets where the shape belongs.',
    action: 'This A-flat shape starts at fret 4, not fret 1. Check the side number before moving your hand.',
  },
  {
    title: 'Recognize a barre',
    chordName: 'F',
    eyebrow: '5 · BARRE PREVIEW',
    body: () =>
      'A long numbered bar means one finger presses every string it crosses. That is a barre. It is an intermediate technique, so understanding the symbol is enough for now.',
    action: 'In this F, finger 1 lies across fret 1. You do not need to make this shape to pass the lesson.',
  },
];

interface ChordDiagramLessonProps {
  onQuizPassed?: (scorePercent: number) => void;
}

export default function ChordDiagramLesson({ onQuizPassed }: ChordDiagramLessonProps) {
  const leftHanded = useSettingsStore((state) => state.leftHanded);
  const [stepIndex, setStepIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const step = GUIDE_STEPS[stepIndex];
  const stepChord = useMemo(() => getChord(step.chordName)!, [step.chordName]);
  const question = CHORD_DIAGRAM_QUIZ[questionIndex];
  const questionChord = getChord(question.chordName)!;

  const startQuiz = useCallback(() => {
    setQuizStarted(true);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
  }, []);

  const chooseAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
  }, [selectedAnswer]);

  const advanceQuiz = useCallback(() => {
    if (selectedAnswer === null) return;
    const earned = selectedAnswer === question.correctIndex ? 1 : 0;
    const nextScore = score + earned;
    if (questionIndex === CHORD_DIAGRAM_QUIZ.length - 1) {
      setScore(nextScore);
      setFinished(true);
      if (nextScore >= PASS_SCORE) {
        onQuizPassed?.(Math.round((nextScore / CHORD_DIAGRAM_QUIZ.length) * 100));
      }
      return;
    }
    setScore(nextScore);
    setQuestionIndex((current) => current + 1);
    setSelectedAnswer(null);
  }, [onQuizPassed, question.correctIndex, questionIndex, score, selectedAnswer]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Read Any Chord Box</Text>
      <Text style={styles.subtitle}>
        Five tiny ideas, one real diagram at a time. About 2 minutes.
      </Text>

      {!quizStarted ? (
        <>
          <View style={styles.stepTabs} accessibilityRole="tablist">
            {GUIDE_STEPS.map((item, index) => {
              const active = index === stepIndex;
              return (
                <PressableScale
                  key={item.eyebrow}
                  style={[styles.stepTab, active && styles.stepTabActive]}
                  onPress={() => setStepIndex(index)}
                  accessibilityRole="tab"
                  accessibilityLabel={`Step ${index + 1}: ${item.title}`}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.stepTabText, active && styles.stepTabTextActive]}>
                    {index + 1}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <View style={[styles.guideCard, CARD_SHADOW]}>
            <View style={styles.copyColumn}>
              <Text style={styles.eyebrow}>{step.eyebrow}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.body}>{step.body(leftHanded)}</Text>
            </View>
            <View style={styles.diagramPanel}>
              <View style={styles.chordNameBadge}>
                <Text style={styles.chordName}>{step.chordName}</Text>
              </View>
              <ChordDiagram chord={stepChord} />
            </View>
            <View style={styles.tryCard}>
              <Ionicons name="hand-left-outline" size={21} color={Colors.warning} />
              <View style={styles.tryCopy}>
                <Text style={styles.tryLabel}>TRY IT ON YOUR GUITAR</Text>
                <Text style={styles.tryText}>{step.action}</Text>
              </View>
            </View>
          </View>

          <View style={styles.fingerCard}>
            <Text style={styles.fingerTitle}>Fretting-hand numbers</Text>
            <View style={styles.fingerRow}>
              {Object.entries(FRETTING_FINGER_NAMES).map(([number, name]) => (
                <View key={number} style={styles.fingerItem}>
                  <View style={styles.fingerNumber}>
                    <Text style={styles.fingerNumberText}>{number}</Text>
                  </View>
                  <Text style={styles.fingerName}>{name}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.fingerNote}>Your thumb supports the back of the neck; it is not numbered here.</Text>
          </View>

          <View style={styles.navigationRow}>
            <PressableScale
              style={[styles.secondaryButton, stepIndex === 0 && styles.buttonDisabled]}
              onPress={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              accessibilityLabel="Previous guide step"
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </PressableScale>
            {stepIndex < GUIDE_STEPS.length - 1 ? (
              <PressableScale
                style={styles.primaryButton}
                onPress={() => setStepIndex((current) => current + 1)}
                accessibilityLabel="Next guide step"
              >
                <Text style={styles.primaryButtonText}>Next idea</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </PressableScale>
            ) : (
              <PressableScale
                style={styles.primaryButton}
                onPress={startQuiz}
                accessibilityLabel="Start the five question chord diagram check"
              >
                <Text style={styles.primaryButtonText}>Check my reading</Text>
              </PressableScale>
            )}
          </View>
        </>
      ) : finished ? (
        <View style={[styles.resultCard, CARD_SHADOW]}>
          <Ionicons
            name={score >= PASS_SCORE ? 'checkmark-circle' : 'refresh-circle'}
            size={56}
            color={score >= PASS_SCORE ? Colors.success : Colors.warning}
          />
          <Text style={styles.resultTitle}>{score >= PASS_SCORE ? 'You can read the map' : 'One more quick look'}</Text>
          <Text style={styles.resultBody}>
            {score} of {CHORD_DIAGRAM_QUIZ.length} correct.{' '}
            {score >= PASS_SCORE
              ? 'Lesson complete. These same diagrams appear in Chords, Songs, and Practice.'
              : `Review the five ideas and try again. ${PASS_SCORE} correct is a pass.`}
          </Text>
          <PressableScale style={styles.primaryButtonWide} onPress={startQuiz} accessibilityLabel="Try the chord diagram check again">
            <Text style={styles.primaryButtonText}>Try again</Text>
          </PressableScale>
          <PressableScale
            style={styles.reviewButton}
            onPress={() => {
              setQuizStarted(false);
              setStepIndex(0);
            }}
            accessibilityLabel="Review the guide"
          >
            <Text style={styles.reviewButtonText}>Review the guide</Text>
          </PressableScale>
        </View>
      ) : (
        <View style={[styles.quizCard, CARD_SHADOW]}>
          <View style={styles.quizHeader}>
            <Text style={styles.eyebrow}>QUICK CHECK</Text>
            <Text style={styles.quizProgress}>{questionIndex + 1}/{CHORD_DIAGRAM_QUIZ.length}</Text>
          </View>
          <View style={styles.quizDiagram}>
            <Text style={styles.quizChordName}>{question.chordName}</Text>
            <ChordDiagram chord={questionChord} />
          </View>
          <Text style={styles.question}>{question.prompt}</Text>
          <View style={styles.options}>
            {question.options.map((option, index) => {
              const answered = selectedAnswer !== null;
              const correct = index === question.correctIndex;
              const chosen = index === selectedAnswer;
              return (
                <PressableScale
                  key={option}
                  style={[
                    styles.option,
                    answered && correct && styles.optionCorrect,
                    answered && chosen && !correct && styles.optionWrong,
                  ]}
                  onPress={() => chooseAnswer(index)}
                  disabled={answered}
                  accessibilityLabel={option}
                  accessibilityState={{ selected: chosen, disabled: answered }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                  {answered && correct && <Ionicons name="checkmark-circle" size={20} color={Colors.success} />}
                  {answered && chosen && !correct && <Ionicons name="close-circle" size={20} color={Colors.danger} />}
                </PressableScale>
              );
            })}
          </View>
          {selectedAnswer !== null && (
            <View style={styles.feedback} accessibilityLiveRegion="polite">
              <Text style={styles.feedbackTitle}>
                {selectedAnswer === question.correctIndex ? 'Correct' : 'Not quite'}
              </Text>
              <Text style={styles.feedbackText}>
                {selectedAnswer === question.correctIndex
                  ? question.explanation
                  : `The answer is “${question.options[question.correctIndex]}.” ${question.explanation.replace('Right: ', '')}`}
              </Text>
              <PressableScale style={styles.primaryButtonWide} onPress={advanceQuiz} accessibilityLabel={questionIndex === CHORD_DIAGRAM_QUIZ.length - 1 ? 'See results' : 'Next question'}>
                <Text style={styles.primaryButtonText}>
                  {questionIndex === CHORD_DIAGRAM_QUIZ.length - 1 ? 'See result' : 'Next question'}
                </Text>
              </PressableScale>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: Colors.spacing.lg, paddingBottom: Colors.spacing.xxl },
  title: { color: Colors.dark.text, fontSize: 27, fontWeight: '800' },
  subtitle: { color: Colors.dark.muted, fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 18 },
  stepTabs: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  stepTab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: Colors.dark.surfaceElevated, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  stepTabActive: { backgroundColor: `${Colors.success}22`, borderColor: Colors.success },
  stepTabText: { color: Colors.dark.muted, fontSize: 15, fontWeight: '800' },
  stepTabTextActive: { color: Colors.success },
  guideCard: { backgroundColor: Colors.dark.card, borderRadius: Colors.radius.lg, borderWidth: 1, borderColor: Colors.dark.cardBorder, overflow: 'hidden' },
  copyColumn: { padding: 20, paddingBottom: 12 },
  eyebrow: { color: Colors.success, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  stepTitle: { color: Colors.dark.text, fontSize: 22, fontWeight: '800', marginTop: 5, marginBottom: 8 },
  body: { color: Colors.dark.muted, fontSize: 15, lineHeight: 22 },
  diagramPanel: { alignItems: 'center', paddingTop: 10, paddingBottom: 14, backgroundColor: '#15152b' },
  chordNameBadge: { backgroundColor: Colors.dark.surfaceElevated, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 5, marginBottom: 5 },
  chordName: { color: Colors.dark.text, fontSize: 18, fontWeight: '800' },
  tryCard: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: 'rgba(255,193,7,0.09)', borderTopWidth: 1, borderTopColor: 'rgba(255,193,7,0.22)' },
  tryCopy: { flex: 1 },
  tryLabel: { color: Colors.warning, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tryText: { color: Colors.dark.text, fontSize: 14, lineHeight: 20, marginTop: 4 },
  fingerCard: { marginTop: 14, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, borderRadius: Colors.radius.md, padding: 16 },
  fingerTitle: { color: Colors.dark.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  fingerRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  fingerItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  fingerNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success },
  fingerNumberText: { color: '#071408', fontSize: 14, fontWeight: '800' },
  fingerName: { color: Colors.dark.text, fontSize: 13, textTransform: 'capitalize' },
  fingerNote: { color: Colors.dark.muted, fontSize: 12, lineHeight: 17, marginTop: 12 },
  navigationRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  secondaryButton: { minHeight: 50, minWidth: 86, alignItems: 'center', justifyContent: 'center', borderRadius: Colors.radius.md, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  secondaryButtonText: { color: Colors.dark.text, fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.4 },
  primaryButton: { flex: 1, minHeight: 50, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: Colors.radius.md, backgroundColor: Colors.success, paddingHorizontal: 14 },
  primaryButtonWide: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: Colors.radius.md, backgroundColor: Colors.success, paddingHorizontal: 18, marginTop: 14 },
  primaryButtonText: { color: '#071408', fontSize: 15, fontWeight: '800' },
  quizCard: { backgroundColor: Colors.dark.card, borderRadius: Colors.radius.lg, padding: 18, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  quizHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quizProgress: { color: Colors.dark.muted, fontSize: 13, fontWeight: '700' },
  quizDiagram: { alignItems: 'center', marginTop: 8 },
  quizChordName: { color: Colors.dark.text, fontSize: 20, fontWeight: '800', marginBottom: 3 },
  question: { color: Colors.dark.text, fontSize: 18, lineHeight: 24, fontWeight: '700', marginTop: 8, marginBottom: 12 },
  options: { gap: 9 },
  option: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: Colors.radius.md, borderWidth: 1, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.surfaceElevated, paddingHorizontal: 15 },
  optionCorrect: { borderColor: Colors.success, backgroundColor: `${Colors.success}18` },
  optionWrong: { borderColor: Colors.danger, backgroundColor: `${Colors.danger}18` },
  optionText: { color: Colors.dark.text, fontSize: 14, fontWeight: '600', flex: 1 },
  feedback: { marginTop: 14, borderTopWidth: 1, borderTopColor: Colors.dark.cardBorder, paddingTop: 14 },
  feedbackTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: '800' },
  feedbackText: { color: Colors.dark.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  resultCard: { alignItems: 'center', backgroundColor: Colors.dark.card, borderRadius: Colors.radius.lg, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 24 },
  resultTitle: { color: Colors.dark.text, fontSize: 23, fontWeight: '800', marginTop: 10 },
  resultBody: { color: Colors.dark.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  reviewButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  reviewButtonText: { color: Colors.success, fontSize: 14, fontWeight: '700' },
});
