import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import { useGuitarSound } from '../../audio/hooks/useGuitarSound';
import { isReferenceAudible, trainingAudioSettings } from '../../audio/audibility';
import { useProgressStore } from '../../store/progressStore';
import { usePracticeTimer } from '../../practice/usePracticeTimer';
import { useSettingsStore } from '../../store/settingsStore';
import {
  TRAINING_ROUND_LENGTH,
  TrainingDifficulty,
  earQuestion,
  fretQuestion,
  intervalHint,
  rhythmAccuracy,
} from './training';

export type TrainingGameId = 'ear-training' | 'rhythm-master' | 'fretboard-explorer';
const TITLES: Record<TrainingGameId, string> = { 'ear-training': 'Ear Training', 'rhythm-master': 'Rhythm Master', 'fretboard-explorer': 'Fretboard Explorer' };
const STRING_LABELS = ['low E (6)', 'A (5)', 'D (4)', 'G (3)', 'B (2)', 'high E (1)'];

export default function TrainingGame({ gameId, onExit }: { gameId: TrainingGameId; onExit: () => void }) {
  const { playNote, stopAll } = useGuitarSound();
  const recordGameScore = useProgressStore((state) => state.recordGameScore);
  const best = useProgressStore((state) => state.gameHighScores[gameId] ?? 0);
  const soundsEnabled = useSettingsStore((state) => state.soundsEnabled);
  const sampleVolume = useSettingsStore((state) => state.sampleVolume);
  const audible = isReferenceAudible({soundsEnabled, sampleVolume});
  const setSoundsEnabled = useSettingsStore((state) => state.setSoundsEnabled);
  const needsSound = gameId !== 'fretboard-explorer';
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<TrainingDifficulty>('guided');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => Math.random());
  const [bpm, setBpm] = useState(90);
  const [taps, setTaps] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFocused = useIsFocused();
  usePracticeTimer(phase === 'playing' && isFocused);

  const stopAudio = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (clickRef.current) clearInterval(clickRef.current);
    timerRef.current = null;
    clickRef.current = null;
    stopAll();
  }, [stopAll]);
  useEffect(() => stopAudio, [stopAudio]);
  useFocusEffect(useCallback(() => stopAudio, [stopAudio]));

  const roundLength = TRAINING_ROUND_LENGTH[difficulty];
  const ear = useMemo(() => earQuestion(seed, round, difficulty), [difficulty, round, seed]);
  const fret = useMemo(() => fretQuestion(seed, round, difficulty), [difficulty, round, seed]);

  const hearInterval = useCallback(() => {
    void playNote(ear.notes[0]);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void playNote(ear.notes[1]), 650);
  }, [ear.notes, playNote]);

  const choose = (choice: string, answer: string) => {
    if (answered) return;
    setAnswered(choice);
    if (choice === answer) {
      setScore((value) => value + 1);
      setStreak((value) => {
        const nextStreak = value + 1;
        setBestStreak((bestValue) => Math.max(bestValue, nextStreak));
        return nextStreak;
      });
    } else setStreak(0);
  };

  const next = () => {
    stopAudio();
    if (round + 1 >= roundLength) {
      const result = Math.round((score / roundLength) * 100);
      recordGameScore(gameId, result);
      setScore(result);
      setPhase('done');
      return;
    }
    setRound((value) => value + 1); setAnswered(null);
  };

  const startRound = (level: TrainingDifficulty) => {
    stopAudio();
    if (needsSound && !audible) {
      const next = trainingAudioSettings(useSettingsStore.getState());
      setSoundsEnabled(next.soundsEnabled);
      useSettingsStore.getState().setSampleVolume(next.sampleVolume);
    }
    if (clickRef.current) clearInterval(clickRef.current);
    setDifficulty(level); setRound(0); setScore(0); setStreak(0); setBestStreak(0);
    setAnswered(null); setTaps([]); setSeed(Math.random());
    setBpm(level === 'guided' ? 60 : 120);
    setPhase('playing');
  };

  const tapBeat = () => {
    const nextTaps = [...taps, Date.now()];
    setTaps(nextTaps);
    if (nextTaps.length === 8) {
      const result = rhythmAccuracy(nextTaps, 60000 / bpm);
      setScore(result);
      recordGameScore(gameId, result);
      if (clickRef.current) clearInterval(clickRef.current);
      setPhase('done');
    }
  };
  const hearTempo = () => {
    if (clickRef.current) clearInterval(clickRef.current);
    setTaps([]); setScore(0);
    let clicks = 1;
    void playNote('E4');
    clickRef.current = setInterval(() => {
      void playNote('E4');
      clicks += 1;
      if (clicks >= 10 && clickRef.current) { clearInterval(clickRef.current); clickRef.current = null; }
    }, 60000 / bpm);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><PressableScale onPress={onExit} style={styles.close} accessibilityRole="button"><Ionicons name="close" size={23} color={Colors.dark.text} /></PressableScale><Text style={styles.title}>{TITLES[gameId]}</Text></View>
      <ScrollView contentContainerStyle={styles.body}>
        {best > 0 && <Text style={styles.best}>Best: {best}</Text>}
        {phase === 'intro' && <View style={[styles.introCard, CARD_SHADOW]}><Text style={styles.introTitle}>Pick your pace</Text><Text style={styles.explain}>Guided mode keeps the round short and reduces choices. Challenge mode adds more material without taking away lives.</Text>{needsSound && !audible && <Text style={styles.soundNote}>Starting enables sound and restores Sample volume to 50% if muted. Check your phone’s media volume too.</Text>}<PressableScale onPress={() => startRound('guided')} style={styles.nextButton}><Text style={styles.nextText}>Guided · easier start</Text></PressableScale><PressableScale onPress={() => startRound('challenge')} style={styles.challengeButton}><Text style={styles.challengeText}>Challenge · full set</Text></PressableScale></View>}
        {phase === 'done' && <View style={[styles.introCard, CARD_SHADOW]}><Text style={styles.resultScore}>{score}%</Text><Text style={styles.introTitle}>{score >= 80 ? 'Great run!' : 'You are building it.'}</Text>{gameId !== 'rhythm-master' && <Text style={styles.explain}>Best streak: {bestStreak}. Mistakes do not cost XP or lives—try the same pace or step down for more clues.</Text>}<PressableScale onPress={() => startRound(difficulty)} style={styles.nextButton}><Text style={styles.nextText}>Play again</Text></PressableScale><PressableScale onPress={() => setPhase('intro')} style={styles.challengeButton}><Text style={styles.challengeText}>Change pace</Text></PressableScale></View>}
        {phase === 'playing' && <>
        {gameId === 'ear-training' && <>
          <Text style={styles.prompt}>Which interval do you hear?</Text>
          <PressableScale onPress={hearInterval} style={styles.listen}><Ionicons name="volume-high" size={25} color={Colors.success} /><Text style={styles.listenText}>Play interval</Text></PressableScale>
          <Text style={styles.progress}>Question {round + 1} of {roundLength} · {score} right {streak >= 2 ? `· 🔥 ${streak}` : ''}</Text>
          {ear.options.map((option) => <Answer key={option.name} label={option.name} picked={answered} answer={ear.answer.name} onPress={() => choose(option.name, ear.answer.name)} />)}
          {answered && <Next right={answered === ear.answer.name} answer={ear.answer.name} explanation={intervalHint(ear.answer.semitones)} final={round + 1 === roundLength} onPress={next} />}
        </>}
        {gameId === 'fretboard-explorer' && <>
          <Text style={styles.prompt}>Name this fretboard note</Text>
          <View style={[styles.questionCard, CARD_SHADOW]}><Text style={styles.fretNumber}>Fret {fret.fretNumber}</Text><Text style={styles.stringName}>{STRING_LABELS[fret.stringIndex]} string</Text></View>
          <Text style={styles.progress}>Question {round + 1} of {roundLength} · {score} right {streak >= 2 ? `· 🔥 ${streak}` : ''}</Text>
          {fret.options.map((option) => <Answer key={option} label={option} picked={answered} answer={fret.answer} onPress={() => choose(option, fret.answer)} />)}
          {answered && <Next right={answered === fret.answer} answer={fret.answer} explanation={`${STRING_LABELS[fret.stringIndex]} at fret ${fret.fretNumber} is ${fret.answer}.`} final={round + 1 === roundLength} onPress={next} />}
        </>}
        {gameId === 'rhythm-master' && <>
          <Text style={styles.prompt}>Tap eight steady beats</Text>
          <Text style={styles.explain}>The first tap starts the clock. Keep each gap near the selected tempo.</Text>
          <View style={styles.bpmRow}>{[60, 90, 120].map((value) => <PressableScale key={value} onPress={() => { stopAudio(); setBpm(value); setTaps([]); setScore(0); }} style={[styles.bpm, bpm === value && styles.bpmActive]}><Text style={styles.bpmText}>{value}</Text></PressableScale>)}</View>
          <PressableScale onPress={hearTempo} style={styles.listen}><Ionicons name="volume-high" size={22} color={Colors.success} /><Text style={styles.listenText}>Start {bpm} BPM click track</Text></PressableScale>
          <PressableScale onPress={tapBeat} disabled={taps.length >= 8} style={styles.tapPad} accessibilityRole="button"><Text style={styles.tapCount}>{Math.min(taps.length, 8)}/8</Text><Text style={styles.tapLabel}>TAP</Text></PressableScale>
        </>}
        </>}
      </ScrollView>
    </View>
  );
}

function Answer({ label, picked, answer, onPress }: { label: string; picked: string | null; answer: string; onPress: () => void }) {
  const right = picked !== null && label === answer;
  const wrong = picked === label && label !== answer;
  return <PressableScale onPress={onPress} disabled={picked !== null} style={[styles.answer, right && styles.answerRight, wrong && styles.answerWrong]} accessibilityRole="button"><Text style={styles.answerText}>{label}</Text></PressableScale>;
}
function Next({ right, answer, explanation, final, onPress }: { right: boolean; answer: string; explanation: string; final: boolean; onPress: () => void }) {
  return <View style={styles.result}><Text style={[styles.feedback, { color: right ? Colors.success : Colors.warning }]}>{right ? 'Correct' : `Answer: ${answer}`}</Text><Text style={styles.explain}>{explanation}</Text><PressableScale onPress={onPress} style={styles.nextButton}><Text style={styles.nextText}>{final ? 'See results' : 'Next'}</Text></PressableScale></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background }, header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.surfaceElevated }, title: { color: Colors.dark.text, fontSize: 21, fontWeight: '800' }, body: { padding: 20, paddingBottom: 120, gap: 12 }, best: { color: Colors.success, fontWeight: '700' }, prompt: { color: Colors.dark.text, fontSize: 25, lineHeight: 32, fontWeight: '800', marginTop: 8 }, explain: { color: Colors.dark.muted, lineHeight: 20 }, listen: { minHeight: 58, borderRadius: 14, borderWidth: 1, borderColor: Colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, listenText: { color: Colors.success, fontWeight: '800' }, progress: { color: Colors.dark.muted, marginVertical: 4 }, answer: { minHeight: 56, borderRadius: 13, borderWidth: 1, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.surfaceElevated, justifyContent: 'center', paddingHorizontal: 18 }, answerRight: { borderColor: Colors.success, backgroundColor: 'rgba(76,175,80,0.14)' }, answerWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(244,67,54,0.14)' }, answerText: { color: Colors.dark.text, fontSize: 17, fontWeight: '700' }, questionCard: { backgroundColor: Colors.dark.card, borderRadius: 18, alignItems: 'center', padding: 28 }, fretNumber: { color: Colors.success, fontSize: 42, fontWeight: '900' }, stringName: { color: Colors.dark.text, fontSize: 17, marginTop: 5 }, result: { alignItems: 'center', gap: 11, marginTop: 8 }, feedback: { fontSize: 17, fontWeight: '800' }, nextButton: { minHeight: 50, minWidth: 150, borderRadius: 13, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' }, nextText: { color: '#071408', fontWeight: '800' }, bpmRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 10 }, bpm: { width: 68, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.cardBorder, alignItems: 'center', justifyContent: 'center' }, bpmActive: { backgroundColor: Colors.success }, bpmText: { color: Colors.dark.text, fontWeight: '800' }, tapPad: { width: 210, height: 210, borderRadius: 105, backgroundColor: Colors.success, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 18 }, tapCount: { color: '#071408', fontSize: 38, fontWeight: '900' }, tapLabel: { color: '#071408', fontWeight: '900', letterSpacing: 4 }, resultScore: { color: Colors.success, fontSize: 44, fontWeight: '900' }, resultText: { color: Colors.dark.muted },
  introCard: { marginTop: 30, padding: 24, borderRadius: 20, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, alignItems: 'center', gap: 16 }, introTitle: { color: Colors.dark.text, fontSize: 23, fontWeight: '900' }, challengeButton: { minHeight: 50, minWidth: 190, borderRadius: 13, borderWidth: 1, borderColor: Colors.success, alignItems: 'center', justifyContent: 'center' }, challengeText: { color: Colors.success, fontWeight: '800' },
  soundNote: { color: Colors.dark.muted, lineHeight: 20, textAlign: 'center', fontWeight: '600' },
});
