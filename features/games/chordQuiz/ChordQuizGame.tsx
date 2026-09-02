import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import ChordDiagram from '../../../components/ChordDiagram';
import { Chord, chordMidiNotes, midiToNoteName } from '../../chords/data/chords';
import { useGuitarSound } from '../../audio/hooks/useGuitarSound';
import { useProgressStore } from '../../store/progressStore';
import { useSettingsStore } from '../../store/settingsStore';
import {
  buildQuiz,
  scoreForAnswer,
  QuizLevel,
  QuizQuestion,
  QuizMode,
  QUIZ_MODES,
} from './quiz';
import { usePracticeTimer } from '../../practice/usePracticeTimer';

export const CHORD_QUIZ_ID = 'chord-quiz';
const ROUND_LENGTH = 10;

type Phase = 'intro' | 'playing' | 'done';

const PROMPTS: Record<QuizQuestion['mode'], string> = {
  'name-from-diagram': 'Which chord is this?',
  'diagram-from-name': 'Pick the right shape',
  'name-from-sound': 'Which chord did you hear?',
};

export default function ChordQuizGame({ onExit }: { onExit: () => void }) {
  const { playChord } = useGuitarSound();
  const recordGameScore = useProgressStore((s) => s.recordGameScore);
  const recordChordAttempt = useProgressStore((s) => s.recordChordAttempt);
  const highScore = useProgressStore((s) => s.gameHighScores[CHORD_QUIZ_ID] ?? 0);
  const soundsEnabled = useSettingsStore((s) => s.soundsEnabled);

  // "Which chord did you hear?" is unanswerable with sounds switched off, so
  // drop that mode rather than serving a question that plays silence.
  const modes: QuizMode[] = soundsEnabled
    ? QUIZ_MODES
    : QUIZ_MODES.filter((m) => m !== 'name-from-sound');

  const [phase, setPhase] = useState<Phase>('intro');
  const [level, setLevel] = useState<QuizLevel>('beginner');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [beatBest, setBeatBest] = useState(false);
  usePracticeTimer(phase === 'playing');

  const question = questions[index];

  const hear = useCallback(
    (chord: Chord) => playChord(chordMidiNotes(chord).map(midiToNoteName)),
    [playChord]
  );

  // Sound questions play themselves on arrival — the sound is the prompt.
  useEffect(() => {
    if (phase !== 'playing' || !question) return;
    if (question.mode === 'name-from-sound' && picked === null) {
      hear(question.answer);
    }
  }, [phase, question, picked, hear]);

  const start = (chosen: QuizLevel) => {
    setLevel(chosen);
    setQuestions(buildQuiz(ROUND_LENGTH, chosen, Math.random, modes));
    setIndex(0);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setPicked(null);
    setBeatBest(false);
    setPhase('playing');
  };

  const choose = (option: Chord) => {
    if (picked !== null || !question) return;
    setPicked(option.name);

    const right = option.name === question.answer.name;
    recordChordAttempt(question.answer.name, right);
    if (right) {
      setScore((s) => s + scoreForAnswer(streak));
      setCorrect((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      // Hearing the chord you just named is the point of the exercise.
      if (question.mode !== 'name-from-sound') hear(question.answer);
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setBeatBest(recordGameScore(CHORD_QUIZ_ID, score));
      setPhase('done');
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const accuracy = questions.length
    ? Math.round((correct / questions.length) * 100)
    : 0;

  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <Header title="Chord Quiz" onExit={onExit} />
        <ScrollView contentContainerStyle={styles.introBody}>
          <Text style={styles.introLead}>
            Name the shape, pick the shape, or name what you hear. Ten
            questions, and a longer run of right answers is worth more.
          </Text>
          {highScore > 0 && (
            <Text style={styles.introBest}>Best so far: {highScore}</Text>
          )}
          {!soundsEnabled && (
            <Text style={styles.introNote}>
              Play Sounds is off in Settings, so the listening questions are
              skipped this round.
            </Text>
          )}

          <Text style={styles.introLabel}>CHOOSE A LEVEL</Text>
          <PressableScale
            style={[styles.levelCard, CARD_SHADOW]}
            onPress={() => start('beginner')}
            accessibilityRole="button"
            accessibilityLabel="Start an open chords round"
          >
            <Text style={styles.levelTitle}>Open chords</Text>
            <Text style={styles.levelBlurb}>
              The shapes you play at the nut. No barres.
            </Text>
          </PressableScale>
          <PressableScale
            style={[styles.levelCard, CARD_SHADOW]}
            onPress={() => start('all')}
            accessibilityRole="button"
            accessibilityLabel="Start an every chord round"
          >
            <Text style={styles.levelTitle}>Every chord</Text>
            <Text style={styles.levelBlurb}>
              The whole library, barre shapes up the neck included.
            </Text>
          </PressableScale>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <Header title="Chord Quiz" onExit={onExit} />
        <Animated.View entering={FadeIn} style={styles.doneBody}>
          <Text style={styles.doneScore}>{score}</Text>
          <Text style={styles.doneLabel}>POINTS</Text>
          {beatBest && <Text style={styles.doneBest}>New best score</Text>}

          <View style={styles.doneStats}>
            <Stat value={`${correct}/${questions.length}`} label="CORRECT" />
            <Stat value={`${accuracy}%`} label="ACCURACY" />
            <Stat value={`${bestStreak}`} label="BEST RUN" />
          </View>

          <PressableScale
            style={[styles.primaryBtn, { backgroundColor: Colors.success }]}
            onPress={() => start(level)}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Play again</Text>
          </PressableScale>
          <PressableScale
            style={styles.secondaryBtn}
            onPress={() => setPhase('intro')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>Change level</Text>
          </PressableScale>
        </Animated.View>
      </View>
    );
  }

  if (!question) return null;

  const answered = picked !== null;
  const gotItRight = picked === question.answer.name;

  return (
    <View style={styles.container}>
      <Header title="Chord Quiz" onExit={onExit} />

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {index + 1}/{questions.length}
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreValue}>{score}</Text>
        {streak >= 2 && (
          <Text style={styles.streakBadge}>{streak} in a row</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.questionBody}>
        <Text style={styles.prompt}>{PROMPTS[question.mode]}</Text>

        {question.mode === 'name-from-diagram' && (
          <View style={styles.promptDiagram}>
            <ChordDiagram chord={question.answer} />
          </View>
        )}

        {question.mode === 'diagram-from-name' && (
          <Text style={styles.promptChordName}>{question.answer.name}</Text>
        )}

        {question.mode === 'name-from-sound' && (
          <PressableScale
            style={[styles.hearAgain, { borderColor: Colors.success }]}
            onPress={() => hear(question.answer)}
            accessibilityRole="button"
            accessibilityLabel="Hear the chord again"
          >
            <Ionicons name="volume-high" size={22} color={Colors.success} />
            <Text style={[styles.hearAgainText, { color: Colors.success }]}>
              Hear it again
            </Text>
          </PressableScale>
        )}

        <View
          style={
            question.mode === 'diagram-from-name'
              ? styles.optionGrid
              : styles.optionList
          }
        >
          {question.options.map((option) => {
            const isAnswer = option.name === question.answer.name;
            const isPicked = option.name === picked;
            const state = !answered
              ? 'idle'
              : isAnswer
              ? 'right'
              : isPicked
              ? 'wrong'
              : 'dim';

            if (question.mode === 'diagram-from-name') {
              return (
                <PressableScale
                  key={option.name}
                  style={[styles.optionTile, OPTION_STYLE[state]]}
                  onPress={() => choose(option)}
                  disabled={answered}
                  accessibilityRole="button"
                  accessibilityLabel={`Shape option ${option.name}`}
                >
                  <ChordDiagram chord={option} small />
                </PressableScale>
              );
            }

            return (
              <PressableScale
                key={option.name}
                style={[styles.optionRow, OPTION_STYLE[state]]}
                onPress={() => choose(option)}
                disabled={answered}
                accessibilityRole="button"
                accessibilityLabel={option.name}
              >
                <Text style={styles.optionText}>{option.name}</Text>
                {answered && isAnswer && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                )}
                {answered && isPicked && !isAnswer && (
                  <Ionicons name="close-circle" size={20} color={Colors.danger} />
                )}
              </PressableScale>
            );
          })}
        </View>

        {answered && (
          <Animated.View entering={FadeInDown.duration(180)} style={styles.feedback}>
            <Text
              style={[
                styles.feedbackText,
                { color: gotItRight ? Colors.success : Colors.danger },
              ]}
            >
              {gotItRight ? 'Correct' : `That was ${question.answer.name}`}
            </Text>
            <PressableScale
              style={[styles.primaryBtn, { backgroundColor: Colors.success }]}
              onPress={next}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>
                {index + 1 >= questions.length ? 'See results' : 'Next'}
              </Text>
            </PressableScale>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function Header({ title, onExit }: { title: string; onExit: () => void }) {
  return (
    <View style={styles.header}>
      <PressableScale
        style={styles.closeBtn}
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel="Leave the game"
      >
        <Ionicons name="close" size={22} color={Colors.dark.text} />
      </PressableScale>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const OPTION_STYLE = StyleSheet.create({
  idle: { borderColor: Colors.dark.cardBorder },
  right: { borderColor: Colors.success, backgroundColor: 'rgba(76,175,80,0.12)' },
  wrong: { borderColor: Colors.danger, backgroundColor: 'rgba(244,67,54,0.12)' },
  dim: { borderColor: Colors.dark.cardBorder, opacity: 0.45 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.dark.text },

  introBody: { paddingHorizontal: 20, paddingBottom: 120, gap: 12 },
  introLead: { fontSize: 15, lineHeight: 22, color: Colors.dark.muted },
  introBest: { fontSize: 14, fontWeight: '700', color: Colors.success },
  introNote: { fontSize: 13, lineHeight: 19, color: Colors.warning },
  introLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.dark.muted,
    marginTop: 8,
  },
  levelCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 16,
    padding: 18,
    gap: 4,
  },
  levelTitle: { fontSize: 17, fontWeight: '700', color: Colors.dark.text },
  levelBlurb: { fontSize: 13, color: Colors.dark.muted, lineHeight: 18 },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.success },
  progressText: { fontSize: 12, fontWeight: '700', color: Colors.dark.muted },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  scoreValue: { fontSize: 26, fontWeight: '800', color: Colors.dark.text },
  streakBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
    backgroundColor: 'rgba(76,175,80,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },

  questionBody: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 140, gap: 16 },
  prompt: { fontSize: 16, fontWeight: '700', color: Colors.dark.text },
  promptDiagram: { alignItems: 'center' },
  promptChordName: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  hearAgain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  hearAgainText: { fontSize: 15, fontWeight: '700' },

  optionList: { gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  optionText: { fontSize: 18, fontWeight: '700', color: Colors.dark.text },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  optionTile: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
  },

  feedback: { alignItems: 'center', gap: 12, marginTop: 4 },
  feedbackText: { fontSize: 17, fontWeight: '800' },

  doneBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },
  doneScore: { fontSize: 64, fontWeight: '800', color: Colors.dark.text },
  doneLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.dark.muted,
  },
  doneBest: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.success,
  },
  doneStats: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 28 },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 14,
    minWidth: 96,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.dark.text },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.dark.muted,
    marginTop: 3,
  },

  primaryBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#0b2410' },
  secondaryBtn: { paddingHorizontal: 32, paddingVertical: 12, marginTop: 6 },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.dark.muted },
});
