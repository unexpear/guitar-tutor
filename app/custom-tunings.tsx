import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors, CARD_SHADOW } from '../constants/Colors';
import PressableScale from '../components/PressableScale';
import { useTuningStore } from '../features/store/tuningStore';
import { createCustomTuning, exportCustomTunings, importCustomTunings, MAX_TUNING_STRINGS } from '../features/tuner/customTuning';
import { INSTRUMENT_PROFILES, type InstrumentId } from '../features/tuner/data/instrumentProfiles';
import type { TuningPreset } from '../features/tuner/data/tunings';

const DEFAULT_INSTRUMENT: InstrumentId = 'guitar-acoustic';

export default function CustomTuningsScreen() {
  const router = useRouter();
  const { customTunings, saveCustomTuning, deleteCustomTuning, replaceCustomTunings } = useTuningStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [instrumentId, setInstrumentId] = useState<InstrumentId>(DEFAULT_INSTRUMENT);
  const [notes, setNotes] = useState('E2 A2 D3 G3 B3 E4');

  const parsedNotes = useMemo(() => notes.trim().split(/[\s,·]+/).filter(Boolean), [notes]);

  const clearEditor = () => {
    setEditingId(null);
    setName('');
    setInstrumentId(DEFAULT_INSTRUMENT);
    setNotes('E2 A2 D3 G3 B3 E4');
  };

  const edit = (tuning: TuningPreset) => {
    setEditingId(tuning.id);
    setName(tuning.name);
    setInstrumentId(tuning.instrumentId);
    setNotes(tuning.strings.join(' '));
  };

  const save = () => {
    try {
      saveCustomTuning(createCustomTuning({ name, instrumentId, strings: parsedNotes }, editingId ?? undefined));
      clearEditor();
      Alert.alert('Saved', 'Your custom tuning is ready in the tuner picker.');
    } catch (error) {
      Alert.alert('Check this tuning', error instanceof Error ? error.message : 'The tuning is invalid.');
    }
  };

  const copyBackup = async () => {
    await Clipboard.setStringAsync(exportCustomTunings(customTunings));
    Alert.alert('Copied', 'Your custom tunings were copied as a portable JSON backup.');
  };

  const pasteBackup = async () => {
    try {
      const imported = importCustomTunings(await Clipboard.getStringAsync());
      replaceCustomTunings(imported);
      Alert.alert('Imported', `${imported.length} custom tuning${imported.length === 1 ? '' : 's'} restored.`);
    } catch (error) {
      Alert.alert('Could not import', error instanceof Error ? error.message : 'The backup is invalid.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>←</Text>
        </PressableScale>
        <Text style={styles.title}>Custom Tunings</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, CARD_SHADOW]}>
          <Text style={styles.cardTitle}>{editingId ? 'Edit tuning' : 'New tuning'}</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="My open tuning" placeholderTextColor={Colors.dark.muted} maxLength={40} style={styles.input} accessibilityLabel="Custom tuning name" />
          <Text style={styles.label}>Instrument</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {INSTRUMENT_PROFILES.filter((profile) => profile.id !== 'chromatic').map((profile) => (
              <Pressable key={profile.id} onPress={() => setInstrumentId(profile.id)} style={[styles.chip, instrumentId === profile.id && styles.chipActive]} accessibilityRole="radio" accessibilityState={{ checked: instrumentId === profile.id }}>
                <Text style={[styles.chipText, instrumentId === profile.id && styles.chipTextActive]}>{profile.shortName}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>Strings, low to high</Text>
          <TextInput value={notes} onChangeText={setNotes} autoCapitalize="characters" autoCorrect={false} placeholder="E2 A2 D3 G3 B3 E4" placeholderTextColor={Colors.dark.muted} style={styles.input} accessibilityLabel="String notes from low to high" />
          <Text style={styles.help}>Use note + octave (A–G, optional # or b), separated by spaces. 1–{MAX_TUNING_STRINGS} strings.</Text>
          <View style={styles.actions}>
            {editingId && <PressableScale onPress={clearEditor} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel</Text></PressableScale>}
            <PressableScale onPress={save} style={styles.primaryButton} accessibilityRole="button"><Text style={styles.primaryText}>{editingId ? 'Update' : 'Save tuning'}</Text></PressableScale>
          </View>
        </View>

        <View style={[styles.card, CARD_SHADOW]}>
          <Text style={styles.cardTitle}>Saved locally</Text>
          {customTunings.length === 0 ? <Text style={styles.empty}>No custom tunings yet.</Text> : customTunings.map((tuning) => (
            <View key={tuning.id} style={styles.savedRow}>
              <Pressable onPress={() => edit(tuning)} style={styles.savedMain} accessibilityRole="button">
                <Text style={styles.savedName}>{tuning.name}</Text>
                <Text style={styles.savedNotes}>{tuning.strings.join(' · ')}</Text>
              </Pressable>
              <PressableScale onPress={() => Alert.alert('Delete tuning?', tuning.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteCustomTuning(tuning.id) }])} style={styles.deleteButton} accessibilityRole="button" accessibilityLabel={`Delete ${tuning.name}`}>
                <Text style={styles.deleteText}>Delete</Text>
              </PressableScale>
            </View>
          ))}
          <View style={styles.actions}>
            <PressableScale onPress={copyBackup} disabled={customTunings.length === 0} style={[styles.secondaryButton, customTunings.length === 0 && styles.disabled]}><Text style={styles.secondaryText}>Copy backup</Text></PressableScale>
            <PressableScale onPress={pasteBackup} style={styles.secondaryButton}><Text style={styles.secondaryText}>Paste backup</Text></PressableScale>
          </View>
          <Text style={styles.help}>Import replaces the current custom-tuning list after validating every entry.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  back: { color: Colors.dark.text, fontSize: 25 },
  title: { color: Colors.dark.text, fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 48 },
  card: { backgroundColor: Colors.dark.card, borderColor: Colors.dark.cardBorder, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { color: Colors.dark.text, fontSize: 19, fontWeight: '700', marginBottom: 12 },
  label: { color: Colors.dark.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 10, marginBottom: 6 },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.surfaceElevated, color: Colors.dark.text, paddingHorizontal: 12, fontSize: 16 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 22, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  chipActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  chipText: { color: Colors.dark.text, fontSize: 13 },
  chipTextActive: { color: '#071408', fontWeight: '700' },
  help: { color: Colors.dark.muted, fontSize: 12, lineHeight: 17, marginTop: 7 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  primaryButton: { minHeight: 48, justifyContent: 'center', backgroundColor: Colors.success, borderRadius: 12, paddingHorizontal: 18 },
  primaryText: { color: '#071408', fontWeight: '800' },
  secondaryButton: { minHeight: 48, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.cardBorder, paddingHorizontal: 16 },
  secondaryText: { color: Colors.dark.text, fontWeight: '600' },
  disabled: { opacity: 0.35 },
  empty: { color: Colors.dark.muted, paddingVertical: 12 },
  savedRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.dark.cardBorder },
  savedMain: { flex: 1, paddingVertical: 11 },
  savedName: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  savedNotes: { color: Colors.dark.muted, fontSize: 12, marginTop: 3 },
  deleteButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: Colors.danger, fontWeight: '600' },
});
