import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import { useProgressStore } from '../../store/progressStore';
import { usePracticeTimer } from '../../practice/usePracticeTimer';
import { xpForGameScore } from '../../progression/playerProgress';
import {
  STARTER_ROUND_LENGTH,
  StarterDifficulty,
  StarterGameId,
  STRING_NAMES,
  starterFeedback,
  starterRoundScore,
  stringQuestion,
  tuneQuestion,
} from './starterArcade';

const COPY: Record<StarterGameId, { title: string; intro: string }> = {
  'string-scout': {
    title: 'String Scout',
    intro: 'Learn the six string names without holding the guitar backwards. Thickest is string 6; thinnest is string 1.',
  },
  'tune-sense': {
    title: 'Tune Sense',
    intro: 'Read a tuner like a guitarist: flat means tune the pitch up, sharp means bring it down, and ±3 cents is in tune.',
  },
};

export default function StarterArcadeGame({
  gameId,
  onExit,
}: {
  gameId: StarterGameId;
  onExit: () => void;
}) {
  const recordGameScore = useProgressStore((state) => state.recordGameScore);
  const best = useProgressStore((state) => state.gameHighScores[gameId] ?? 0);
  const [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => Math.random());
  const [lastXp, setLastXp] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<StarterDifficulty>('guided');
  usePracticeTimer(playing);

  const roundLength = STARTER_ROUND_LENGTH[difficulty];
  const stringRound = useMemo(() => stringQuestion(seed, round, difficulty), [difficulty, seed, round]);
  const tuneRound = useMemo(() => tuneQuestion(seed, round, difficulty), [difficulty, seed, round]);
  const answer = gameId === 'string-scout' ? stringRound.answer : tuneRound.answer;
  const options = gameId === 'string-scout' ? stringRound.options : tuneRound.options;

  const choose = (choice: string) => {
    if (picked) return;
    setPicked(choice);
    if (choice === answer) {
      setCorrect((value) => value + 1);
      setStreak((value) => {
        const nextStreak = value + 1;
        setBestStreak((bestValue) => Math.max(bestValue, nextStreak));
        return nextStreak;
      });
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (round + 1 >= roundLength) {
      const result = starterRoundScore(correct, roundLength);
      recordGameScore(gameId, result);
      setLastXp(xpForGameScore(result));
      setLastScore(result);
      setPlaying(false);
      return;
    }
    setRound((value) => value + 1);
    setPicked(null);
  };

  const start = (nextDifficulty: StarterDifficulty) => {
    setDifficulty(nextDifficulty);
    setRound(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setPicked(null);
    setSeed(Math.random());
    setLastXp(0);
    setLastScore(null);
    setPlaying(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={onExit} style={styles.close} accessibilityRole="button" accessibilityLabel="Close game">
          <Ionicons name="close" size={23} color={Colors.dark.text} />
        </PressableScale>
        <Text style={styles.title}>{COPY[gameId].title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {!playing ? (
          <View style={[styles.introCard, CARD_SHADOW]}>
            <Text style={styles.arcadeIcon}>{gameId === 'string-scout' ? '🧭' : '🎯'}</Text>
            <Text style={styles.lead}>{COPY[gameId].intro}</Text>
            {best > 0 && <Text style={styles.best}>Personal best · {best}%</Text>}
            {lastScore !== null && <Text style={styles.resultScore}>{lastScore}%</Text>}
            {lastXp > 0 && <Text style={styles.xp}>+{lastXp} XP · best run {bestStreak}</Text>}
            {lastScore !== null && <Text style={styles.coach}>{lastScore >= 80 ? 'Nice work. Challenge mode is ready when you are.' : 'Good practice. Guided mode will keep reinforcing the tricky parts.'}</Text>}
            <PressableScale onPress={() => start('guided')} style={styles.primary} accessibilityRole="button" accessibilityLabel="Start a guided six-question round">
              <Text style={styles.primaryText}>Guided · 6 questions</Text>
            </PressableScale>
            <PressableScale onPress={() => start('challenge')} style={styles.secondary} accessibilityRole="button" accessibilityLabel="Start a ten-question challenge round"><Text style={styles.secondaryText}>Challenge · 10 questions</Text></PressableScale>
          </View>
        ) : (
          <>
            <View style={styles.hud}><Text style={styles.progress}>ROUND {round + 1}/{roundLength} · {correct} RIGHT</Text>{streak >= 2 && <Text style={styles.streak}>🔥 {streak} RUN</Text>}</View>
            {gameId === 'string-scout' ? (
              <View style={[styles.questionCard, CARD_SHADOW]}>
                <Text style={styles.eyebrow}>{stringRound.thickness.toUpperCase()} STRING</Text>
                <View style={styles.stringPicture}>
                  {STRING_NAMES.map((name, index) => {
                    const number = 6 - index;
                    const active = number === stringRound.stringNumber;
                    return <View key={name} style={[styles.stringLine, { height: 2 + (6 - index) * 0.8 }, active && styles.stringLineActive]} />;
                  })}
                </View>
                <Text style={styles.question}>Which string is highlighted?</Text>
              </View>
            ) : (
              <View style={[styles.questionCard, CARD_SHADOW]}>
                <Text style={styles.eyebrow}>{tuneRound.cents < 0 ? 'FLAT' : tuneRound.cents > 0 ? 'SHARP' : 'CENTERED'}</Text>
                <Text style={styles.cents}>{tuneRound.cents > 0 ? '+' : ''}{tuneRound.cents}¢</Text>
                <View style={styles.meter}><View style={styles.meterCenter} /><View style={[styles.meterNeedle, { transform: [{ translateX: tuneRound.cents * 2.2 }] }]} /></View>
                <Text style={styles.question}>What should you do?</Text>
              </View>
            )}
            {options.map((option) => {
              const isAnswer = option === answer;
              const isWrong = picked === option && !isAnswer;
              return (
                <PressableScale key={option} onPress={() => choose(option)} disabled={!!picked} style={[styles.answer, picked && isAnswer && styles.answerRight, isWrong && styles.answerWrong]} accessibilityRole="button">
                  <Text style={styles.answerText}>{option}</Text>
                </PressableScale>
              );
            })}
            {picked && (
              <View style={styles.feedback}>
                <Text style={[styles.feedbackText, { color: picked === answer ? Colors.success : Colors.warning }]}>{picked === answer ? 'Nice!' : 'Almost — here is the rule:'}</Text>
                <Text style={styles.explanation}>{starterFeedback(gameId, answer, gameId === 'tune-sense' ? tuneRound.cents : undefined)}</Text>
                <PressableScale onPress={next} style={styles.next}><Text style={styles.nextText}>{round + 1 === roundLength ? 'See results' : 'Next'}</Text></PressableScale>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.surfaceElevated },
  title: { color: Colors.dark.text, fontSize: 23, fontWeight: '900' },
  body: { padding: 20, paddingBottom: 120, gap: 12 },
  introCard: { marginTop: 40, padding: 26, borderRadius: 22, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, alignItems: 'center', gap: 16 },
  arcadeIcon: { fontSize: 52 },
  lead: { color: Colors.dark.text, fontSize: 18, lineHeight: 27, textAlign: 'center' },
  best: { color: Colors.warning, fontWeight: '800' },
  resultScore: { color: Colors.dark.text, fontSize: 46, fontWeight: '900' },
  xp: { color: Colors.success, fontWeight: '900', fontSize: 17 },
  coach: { color: Colors.dark.muted, lineHeight: 21, textAlign: 'center' },
  primary: { minHeight: 58, paddingHorizontal: 28, borderRadius: 15, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#071408', fontWeight: '900', fontSize: 17 },
  secondary: { minHeight: 54, paddingHorizontal: 28, borderRadius: 15, borderWidth: 1, borderColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: Colors.success, fontWeight: '900', fontSize: 16 },
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  progress: { color: Colors.dark.muted, fontWeight: '800', letterSpacing: 1.2 },
  streak: { color: Colors.warning, fontWeight: '900', fontSize: 12 },
  questionCard: { minHeight: 290, padding: 24, borderRadius: 22, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, alignItems: 'center', justifyContent: 'center', gap: 20 },
  eyebrow: { color: Colors.success, fontWeight: '900', letterSpacing: 2 },
  question: { color: Colors.dark.text, fontSize: 23, fontWeight: '900', textAlign: 'center' },
  stringPicture: { width: '88%', gap: 15, paddingVertical: 15 },
  stringLine: { width: '100%', borderRadius: 4, backgroundColor: '#555779' },
  stringLineActive: { backgroundColor: Colors.success, shadowColor: Colors.success, shadowOpacity: 0.8, shadowRadius: 8 },
  cents: { color: Colors.dark.text, fontSize: 58, fontWeight: '900' },
  meter: { width: '85%', height: 8, borderRadius: 4, backgroundColor: '#3B3D61', position: 'relative', alignItems: 'center' },
  meterCenter: { position: 'absolute', width: 4, height: 24, top: -8, backgroundColor: Colors.success },
  meterNeedle: { position: 'absolute', width: 10, height: 28, borderRadius: 5, top: -10, backgroundColor: Colors.warning },
  answer: { minHeight: 58, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.surfaceElevated, justifyContent: 'center' },
  answerRight: { borderColor: Colors.success, backgroundColor: 'rgba(76,175,80,0.18)' },
  answerWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(244,67,54,0.16)' },
  answerText: { color: Colors.dark.text, fontSize: 17, fontWeight: '800' },
  feedback: { alignItems: 'center', gap: 12, marginTop: 8 },
  feedbackText: { fontSize: 18, fontWeight: '900' },
  explanation: { color: Colors.dark.text, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  next: { minHeight: 50, minWidth: 150, borderRadius: 13, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  nextText: { color: '#071408', fontWeight: '900' },
});
