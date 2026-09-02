import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import { useGuitarSound } from '../../audio/hooks/useGuitarSound';
import { useProgressStore } from '../../store/progressStore';
import { usePracticeTimer } from '../../practice/usePracticeTimer';
import { fretboardNote, INTERVALS, noteNameFromMidi, rhythmAccuracy } from './training';

export type TrainingGameId = 'ear-training' | 'rhythm-master' | 'fretboard-explorer';
const TITLES: Record<TrainingGameId, string> = { 'ear-training': 'Ear Training', 'rhythm-master': 'Rhythm Master', 'fretboard-explorer': 'Fretboard Explorer' };
const STRING_LABELS = ['low E (6)', 'A (5)', 'D (4)', 'G (3)', 'B (2)', 'high E (1)'];

export default function TrainingGame({ gameId, onExit }: { gameId: TrainingGameId; onExit: () => void }) {
  const { playNote } = useGuitarSound();
  const recordGameScore = useProgressStore((state) => state.recordGameScore);
  const best = useProgressStore((state) => state.gameHighScores[gameId] ?? 0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => Math.random());
  const [bpm, setBpm] = useState(90);
  const [taps, setTaps] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  usePracticeTimer(true);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); if (clickRef.current) clearInterval(clickRef.current); }, []);

  const ear = useMemo(() => {
    const answerIndex = Math.floor(seed * INTERVALS.length) % INTERVALS.length;
    const answer = INTERVALS[answerIndex];
    const rootMidi = 48 + (Math.floor(seed * 100) % 8);
    const remaining = INTERVALS.filter((item) => item.name !== answer.name);
    const start = Math.floor(seed * 1000) % remaining.length;
    const distractors = Array.from(
      { length: 3 },
      (_, index) => remaining[(start + index) % remaining.length],
    );
    return { answer, notes: [noteNameFromMidi(rootMidi), noteNameFromMidi(rootMidi + answer.semitones)], options: [answer, ...distractors].sort((a, b) => a.semitones - b.semitones) };
  }, [seed]);

  const fret = useMemo(() => {
    const stringIndex = Math.floor(seed * 60) % 6;
    const fretNumber = Math.floor(seed * 1000) % 13;
    const answer = fretboardNote(stringIndex, fretNumber);
    const options = [answer];
    let offset = 1;
    while (options.length < 4) {
      const candidate = fretboardNote(stringIndex, (fretNumber + offset * 2) % 13);
      if (!options.includes(candidate)) options.push(candidate);
      offset += 1;
    }
    return { stringIndex, fretNumber, answer, options: options.sort() };
  }, [seed]);

  const hearInterval = useCallback(() => {
    void playNote(ear.notes[0]);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void playNote(ear.notes[1]), 650);
  }, [ear.notes, playNote]);

  const choose = (choice: string, answer: string) => {
    if (answered) return;
    setAnswered(choice);
    if (choice === answer) setScore((value) => value + 100);
  };

  const next = () => {
    if (round >= 9) {
      // `choose` has already committed this answer before the Next button can
      // be pressed, so `score` includes the tenth question here.
      recordGameScore(gameId, score);
      setRound(0); setScore(0); setAnswered(null); setSeed(Math.random());
      return;
    }
    setRound((value) => value + 1); setAnswered(null); setSeed(Math.random());
  };

  const tapBeat = () => {
    const nextTaps = [...taps, Date.now()];
    setTaps(nextTaps);
    if (nextTaps.length === 8) {
      const result = rhythmAccuracy(nextTaps, 60000 / bpm);
      setScore(result);
      recordGameScore(gameId, result);
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
        {gameId === 'ear-training' && <>
          <Text style={styles.prompt}>Which interval do you hear?</Text>
          <PressableScale onPress={hearInterval} style={styles.listen}><Ionicons name="volume-high" size={25} color={Colors.success} /><Text style={styles.listenText}>Play interval</Text></PressableScale>
          <Text style={styles.progress}>Question {round + 1} of 10 · {score} points</Text>
          {ear.options.map((option) => <Answer key={option.name} label={option.name} picked={answered} answer={ear.answer.name} onPress={() => choose(option.name, ear.answer.name)} />)}
          {answered && <Next right={answered === ear.answer.name} answer={ear.answer.name} onPress={next} />}
        </>}
        {gameId === 'fretboard-explorer' && <>
          <Text style={styles.prompt}>Name this fretboard note</Text>
          <View style={[styles.questionCard, CARD_SHADOW]}><Text style={styles.fretNumber}>Fret {fret.fretNumber}</Text><Text style={styles.stringName}>{STRING_LABELS[fret.stringIndex]} string</Text></View>
          <Text style={styles.progress}>Question {round + 1} of 10 · {score} points</Text>
          {fret.options.map((option) => <Answer key={option} label={option} picked={answered} answer={fret.answer} onPress={() => choose(option, fret.answer)} />)}
          {answered && <Next right={answered === fret.answer} answer={fret.answer} onPress={next} />}
        </>}
        {gameId === 'rhythm-master' && <>
          <Text style={styles.prompt}>Tap eight steady beats</Text>
          <Text style={styles.explain}>The first tap starts the clock. Keep each gap near the selected tempo.</Text>
          <View style={styles.bpmRow}>{[60, 90, 120].map((value) => <PressableScale key={value} onPress={() => { setBpm(value); setTaps([]); setScore(0); }} style={[styles.bpm, bpm === value && styles.bpmActive]}><Text style={styles.bpmText}>{value}</Text></PressableScale>)}</View>
          <PressableScale onPress={hearTempo} style={styles.listen}><Ionicons name="volume-high" size={22} color={Colors.success} /><Text style={styles.listenText}>Start {bpm} BPM click track</Text></PressableScale>
          <PressableScale onPress={tapBeat} disabled={taps.length >= 8} style={styles.tapPad} accessibilityRole="button"><Text style={styles.tapCount}>{Math.min(taps.length, 8)}/8</Text><Text style={styles.tapLabel}>TAP</Text></PressableScale>
          {taps.length >= 8 && <View style={styles.result}><Text style={styles.resultScore}>{score}%</Text><Text style={styles.resultText}>timing accuracy</Text><PressableScale onPress={() => { setTaps([]); setScore(0); }} style={styles.nextButton}><Text style={styles.nextText}>Try again</Text></PressableScale></View>}
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
function Next({ right, answer, onPress }: { right: boolean; answer: string; onPress: () => void }) {
  return <View style={styles.result}><Text style={[styles.feedback, { color: right ? Colors.success : Colors.danger }]}>{right ? 'Correct' : `Answer: ${answer}`}</Text><PressableScale onPress={onPress} style={styles.nextButton}><Text style={styles.nextText}>Next</Text></PressableScale></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background }, header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.surfaceElevated }, title: { color: Colors.dark.text, fontSize: 21, fontWeight: '800' }, body: { padding: 20, paddingBottom: 120, gap: 12 }, best: { color: Colors.success, fontWeight: '700' }, prompt: { color: Colors.dark.text, fontSize: 25, lineHeight: 32, fontWeight: '800', marginTop: 8 }, explain: { color: Colors.dark.muted, lineHeight: 20 }, listen: { minHeight: 58, borderRadius: 14, borderWidth: 1, borderColor: Colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, listenText: { color: Colors.success, fontWeight: '800' }, progress: { color: Colors.dark.muted, marginVertical: 4 }, answer: { minHeight: 56, borderRadius: 13, borderWidth: 1, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.surfaceElevated, justifyContent: 'center', paddingHorizontal: 18 }, answerRight: { borderColor: Colors.success, backgroundColor: 'rgba(76,175,80,0.14)' }, answerWrong: { borderColor: Colors.danger, backgroundColor: 'rgba(244,67,54,0.14)' }, answerText: { color: Colors.dark.text, fontSize: 17, fontWeight: '700' }, questionCard: { backgroundColor: Colors.dark.card, borderRadius: 18, alignItems: 'center', padding: 28 }, fretNumber: { color: Colors.success, fontSize: 42, fontWeight: '900' }, stringName: { color: Colors.dark.text, fontSize: 17, marginTop: 5 }, result: { alignItems: 'center', gap: 11, marginTop: 8 }, feedback: { fontSize: 17, fontWeight: '800' }, nextButton: { minHeight: 50, minWidth: 150, borderRadius: 13, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' }, nextText: { color: '#071408', fontWeight: '800' }, bpmRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 10 }, bpm: { width: 68, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.cardBorder, alignItems: 'center', justifyContent: 'center' }, bpmActive: { backgroundColor: Colors.success }, bpmText: { color: Colors.dark.text, fontWeight: '800' }, tapPad: { width: 210, height: 210, borderRadius: 105, backgroundColor: Colors.success, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 18 }, tapCount: { color: '#071408', fontSize: 38, fontWeight: '900' }, tapLabel: { color: '#071408', fontWeight: '900', letterSpacing: 4 }, resultScore: { color: Colors.success, fontSize: 44, fontWeight: '900' }, resultText: { color: Colors.dark.muted },
});
