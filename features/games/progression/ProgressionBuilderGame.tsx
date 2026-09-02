import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import { CHORDS, chordMidiNotes, midiToNoteName } from '../../chords/data/chords';
import { useGuitarSound } from '../../audio/hooks/useGuitarSound';
import { usePracticeToolsStore } from '../../store/practiceToolsStore';

const CHOICES = ['C', 'G', 'Am', 'F', 'D', 'Em', 'A', 'E', 'Dm'];

export default function ProgressionBuilderGame({ onExit }: { onExit: () => void }) {
  const [selected, setSelected] = useState<string[]>(['C', 'G', 'Am', 'F']);
  const progressions = usePracticeToolsStore((state) => state.progressions);
  const saveProgression = usePracticeToolsStore((state) => state.saveProgression);
  const deleteProgression = usePracticeToolsStore((state) => state.deleteProgression);
  const { playChord } = useGuitarSound();
  const playIndex = useRef(0);
  const hear = (name: string) => { const chord = CHORDS.find((item) => item.name === name); if (chord) void playChord(chordMidiNotes(chord).map(midiToNoteName)); };
  const playNext = () => { if (!selected.length) return; const name = selected[playIndex.current % selected.length]; playIndex.current += 1; hear(name); };

  return <View style={styles.container}>
    <View style={styles.header}><PressableScale onPress={onExit} style={styles.close}><Ionicons name="close" size={23} color={Colors.dark.text} /></PressableScale><Text style={styles.title}>Progression Builder</Text></View>
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.help}>Build an original 2–8 chord loop. Tap a chord to add it, then step through it while you play.</Text>
      <View style={styles.progression}>{selected.map((name, index) => <PressableScale key={`${name}-${index}`} onPress={() => { setSelected((items) => items.filter((_, itemIndex) => itemIndex !== index)); playIndex.current = 0; }} style={styles.selected}><Text style={styles.selectedText}>{name}</Text><Text style={styles.remove}>×</Text></PressableScale>)}</View>
      <View style={styles.choices}>{CHOICES.map((name) => <PressableScale key={name} disabled={selected.length >= 8} onPress={() => { setSelected((items) => [...items, name]); hear(name); }} style={styles.choice}><Text style={styles.choiceText}>{name}</Text></PressableScale>)}</View>
      <View style={styles.actions}><PressableScale onPress={playNext} style={styles.primary}><Text style={styles.primaryText}>Play next chord</Text></PressableScale><PressableScale disabled={selected.length < 2} onPress={() => saveProgression(selected)} style={styles.secondary}><Text style={styles.secondaryText}>Save locally</Text></PressableScale></View>
      {progressions.length > 0 && <><Text style={styles.savedTitle}>Saved progressions</Text>{progressions.map((item, index) => <View key={`${item.join('-')}-${index}`} style={styles.savedRow}><PressableScale onPress={() => { setSelected(item); playIndex.current = 0; }} style={styles.savedMain}><Text style={styles.savedText}>{item.join('  ·  ')}</Text></PressableScale><PressableScale onPress={() => deleteProgression(index)} style={styles.delete}><Text style={styles.deleteText}>Delete</Text></PressableScale></View>)}</>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: Colors.dark.background }, header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.surfaceElevated }, title: { color: Colors.dark.text, fontSize: 21, fontWeight: '800' }, body: { padding: 20, paddingBottom: 120, gap: 15 }, help: { color: Colors.dark.muted, fontSize: 15, lineHeight: 22 }, progression: { minHeight: 88, borderRadius: 16, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, selected: { minWidth: 55, minHeight: 52, borderRadius: 11, backgroundColor: Colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10 }, selectedText: { color: '#071408', fontSize: 18, fontWeight: '900' }, remove: { color: '#17451a', fontSize: 17 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { minWidth: 55, minHeight: 48, borderRadius: 11, borderWidth: 1, borderColor: Colors.dark.cardBorder, alignItems: 'center', justifyContent: 'center' }, choiceText: { color: Colors.dark.text, fontWeight: '700' }, actions: { gap: 10 }, primary: { minHeight: 54, borderRadius: 13, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#071408', fontWeight: '900' }, secondary: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: Colors.success, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: Colors.success, fontWeight: '800' }, savedTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: '800', marginTop: 12 }, savedRow: { flexDirection: 'row', minHeight: 58, borderBottomWidth: 1, borderBottomColor: Colors.dark.cardBorder, alignItems: 'center' }, savedMain: { flex: 1, minHeight: 52, justifyContent: 'center' }, savedText: { color: Colors.dark.text, fontWeight: '600' }, delete: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 }, deleteText: { color: Colors.danger, fontWeight: '600' } });
