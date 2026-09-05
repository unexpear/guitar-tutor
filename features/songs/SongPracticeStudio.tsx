import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Linking, Share, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import { midiToNoteName, stringFretToMidi } from '../chords/data/chords';
import { useGuitarSound } from '../audio/hooks/useGuitarSound';
import { isReferenceAudible } from '../audio/audibility';
import { useSettingsStore } from '../store/settingsStore';
import { useProgressStore } from '../store/progressStore';
import type { Song, SongEvent } from './data/songs';
import {
  DEFAULT_SONG_PRACTICE_OPTIONS,
  arrangementEvents,
  guideChordMidiNotes,
  capoChoicesForSong,
  songPracticeFeedback,
  songCorrectionIssueUrl,
  transposeChordName,
  transposeKey,
  transposeNoteEvent,
  type SongPracticeOptions,
} from './songPractice';

const SPEEDS: SongPracticeOptions['tempoPercent'][] = [50, 75, 100, 125];

function eventLabel(event: SongEvent): string {
  return event.kind === 'chord' ? event.chordName : event.label;
}

export default function SongPracticeStudio({
  song,
  bestScore,
  onClose,
  onStart,
}: {
  song: Song;
  bestScore: number;
  onClose: () => void;
  onStart: (options: SongPracticeOptions) => void;
}) {
  const arrangement = song.arrangement;
  const storedOptions = useProgressStore((state) => state.songPracticeOptions[song.id]);
  const favoriteSongs = useProgressStore((state) => state.favoriteSongs);
  const songSetlists = useProgressStore((state) => state.songSetlists);
  const toggleFavoriteSong = useProgressStore((state) => state.toggleFavoriteSong);
  const toggleSongInSetlist = useProgressStore((state) => state.toggleSongInSetlist);
  const saveOptions = useProgressStore((state) => state.saveSongPracticeOptions);
  const saveDraft = useProgressStore((state) => state.saveSongCorrectionDraft);
  const [options, setOptions] = useState<SongPracticeOptions>({
    ...DEFAULT_SONG_PRACTICE_OPTIONS,
    ...storedOptions,
    sectionId: song.arrangement?.sections.some((section) => section.id === storedOptions?.sectionId)
      ? storedOptions!.sectionId : null,
  });
  const [correction, setCorrection] = useState('');
  const [guideIndex, setGuideIndex] = useState(-1);
  const guideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playChord, playNote, stopAll } = useGuitarSound();
  const events = useMemo(
    () => arrangementEvents(song, options.sectionId),
    [song, options.sectionId],
  );
  const transposeSemitones = options.transposeSemitones ?? 0;
  const shapeShift = transposeSemitones - options.capo;
  const capoChoices = useMemo(
    () => capoChoicesForSong(song, transposeSemitones),
    [song, transposeSemitones],
  );
  const capoByFret = [...capoChoices].sort((a, b) => a.capo - b.capo);
  const currentCapoIndex = capoByFret.findIndex((choice) => choice.capo === options.capo);
  const isFavorite = favoriteSongs.includes(song.id);
  const mySet = songSetlists.find((setlist) => setlist.id === 'my-set');
  const isInSet = mySet?.songIds.includes(song.id) ?? false;

  const stopGuide = useCallback(() => {
    if (guideTimer.current) clearTimeout(guideTimer.current);
    guideTimer.current = null;
    setGuideIndex(-1);
    stopAll();
  }, [stopAll]);
  useFocusEffect(useCallback(() => stopGuide, [stopGuide]));
  useEffect(() => stopGuide, [stopGuide]);

  if (!arrangement) return null;

  const updateOptions = (next: SongPracticeOptions) => {
    stopGuide();
    setOptions(next);
    saveOptions(song.id, next);
  };

  const transposeTo = (nextSemitones: number) => {
    const choices = capoChoicesForSong(song, nextSemitones);
    const nextCapo = choices.find((choice) => choice.capo === 0)?.capo ?? choices[0]?.capo ?? 0;
    updateOptions({ ...options, transposeSemitones: nextSemitones, capo: nextCapo });
  };

  const playGuideEvent = (index: number) => {
    if (index >= events.length) {
      stopGuide();
      return;
    }
    if (!isReferenceAudible(useSettingsStore.getState())) {
      // Use the shared mute explanation, then stop instead of advancing silently.
      void playNote('A4');
      stopGuide();
      return;
    }
    setGuideIndex(index);
    const event = events[index];
    if (event.kind === 'chord') {
      void playChord(guideChordMidiNotes(event.chordName, transposeSemitones, options.capo).map(midiToNoteName));
    } else {
      const note = transposeNoteEvent(event, transposeSemitones);
      playNote(midiToNoteName(stringFretToMidi(note.stringIndex, note.fret)));
    }
    const beatMs = 60_000 / Math.round(arrangement.bpm * options.tempoPercent / 100);
    // A guide is intentionally separate from microphone scoring: speaker
    // playback would otherwise be mistaken for the player's instrument.
    guideTimer.current = setTimeout(() => playGuideEvent(index + 1), beatMs * event.beats);
  };

  const shareCorrection = async () => {
    const message = correction.trim();
    if (!message) return;
    const draft = { songId: song.id, message, createdAt: new Date().toISOString() };
    saveDraft(draft);
    await Share.share({
      title: `StandardTune chart note: ${song.title}`,
      message: `StandardTune chart note for “${song.title}”\n\n${message}\n\nChart license: ${song.arrangement?.license}`,
    });
    setCorrection('');
  };

  const submitCorrection = async () => {
    const message = correction.trim();
    if (!message) return;
    saveDraft({ songId: song.id, message, createdAt: new Date().toISOString() });
    await Linking.openURL(songCorrectionIssueUrl(song, message));
    setCorrection('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={onClose} style={styles.iconButton} accessibilityLabel="Back to songs and exercises">
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </PressableScale>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>PRACTICE STUDIO · EXERCISES</Text>
          <Text style={styles.title}>{song.title}</Text>
        </View>
        <PressableScale
          onPress={() => toggleFavoriteSong(song.id)}
          style={styles.iconButton}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={23} color={isFavorite ? Colors.warning : Colors.dark.text} />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroKey}>{transposeKey(song.key, transposeSemitones)}</Text>
          <Text style={styles.heroMeta}>
            {Math.round(arrangement.bpm * options.tempoPercent / 100)} BPM · {arrangement.beatsPerBar}/4 · {arrangement.strumPattern}
          </Text>
          <Text style={styles.heroHint}>
            Follow Me waits until you get each target. Play in Time holds the beat. Use headphones for the guide track so the mic grades your guitar, not the phone.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1 · Choose a section</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          <OptionPill label="Whole exercise" active={options.sectionId === null} onPress={() => updateOptions({ ...options, sectionId: null })} />
          {arrangement.sections.map((section) => (
            <OptionPill key={section.id} label={section.label} active={options.sectionId === section.id} onPress={() => updateOptions({ ...options, sectionId: section.id })} />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>2 · Set a comfortable speed</Text>
        <View style={styles.pillRow}>
          {SPEEDS.map((speed) => (
            <OptionPill key={speed} label={`${speed}%`} active={options.tempoPercent === speed} onPress={() => updateOptions({ ...options, tempoPercent: speed })} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>3 · Transpose and capo</Text>
        <View style={styles.stepper}>
          <PressableScale
            style={styles.stepButton}
            onPress={() => transposeTo(Math.max(-5, transposeSemitones - 1))}
            accessibilityLabel="Transpose down one semitone"
          ><Ionicons name="remove" size={22} color={Colors.dark.text} /></PressableScale>
          <View style={styles.stepValue}>
            <Text style={styles.stepValueMain}>Exercise key · {transposeKey(song.key, transposeSemitones)}</Text>
            <Text style={styles.stepValueSub}>{transposeSemitones === 0 ? 'Base key' : `${transposeSemitones > 0 ? '+' : ''}${transposeSemitones} semitones`}</Text>
          </View>
          <PressableScale
            style={styles.stepButton}
            onPress={() => transposeTo(Math.min(6, transposeSemitones + 1))}
            accessibilityLabel="Transpose up one semitone"
          ><Ionicons name="add" size={22} color={Colors.dark.text} /></PressableScale>
        </View>
        <View style={styles.stepper}>
          <PressableScale
            style={styles.stepButton}
            onPress={() => updateOptions({ ...options, capo: capoByFret[Math.max(0, currentCapoIndex - 1)]?.capo ?? 0 })}
            accessibilityLabel="Move capo down one fret"
          ><Ionicons name="remove" size={22} color={Colors.dark.text} /></PressableScale>
          <View style={styles.stepValue}>
            <Text style={styles.stepValueMain}>{options.capo === 0 ? 'No capo' : `Fret ${options.capo}`}</Text>
            <Text style={styles.stepValueSub}>Play {transposeKey(song.key, shapeShift)} shapes · sounds in {transposeKey(song.key, transposeSemitones)}</Text>
          </View>
          <PressableScale
            style={styles.stepButton}
            onPress={() => updateOptions({ ...options, capo: capoByFret[Math.min(capoByFret.length - 1, currentCapoIndex + 1)]?.capo ?? 0 })}
            accessibilityLabel="Move capo up one fret"
          ><Ionicons name="add" size={22} color={Colors.dark.text} /></PressableScale>
        </View>
        {capoChoices[0] && (
          <PressableScale
            style={styles.easyButton}
            onPress={() => updateOptions({ ...options, capo: capoChoices[0].capo })}
          >
            <Ionicons name="sparkles" size={17} color={Colors.warning} />
            <Text style={styles.easyText}>Easiest shapes · {capoChoices[0].capo === 0 ? 'no capo' : `capo ${capoChoices[0].capo}`} · {capoChoices[0].shapes.join('  ')}</Text>
          </PressableScale>
        )}

        <Text style={styles.sectionTitle}>4 · Preview the chart</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeline}>
          {events.map((event, index) => (
            <View key={`${index}-${eventLabel(event)}`} style={[styles.eventChip, guideIndex === index && styles.eventChipActive]}>
              <Text style={[styles.eventLabel, guideIndex === index && styles.eventLabelActive]}>
                {event.kind === 'chord' ? transposeChordName(event.chordName, shapeShift) ?? event.chordName : transposeNoteEvent(event, transposeSemitones).label}
              </Text>
              <Text style={styles.eventBeats}>{event.beats} beat{event.beats === 1 ? '' : 's'}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.actionRow}>
          <PressableScale style={styles.secondaryButton} onPress={guideIndex >= 0 ? stopGuide : () => playGuideEvent(0)}>
            <Ionicons name={guideIndex >= 0 ? 'stop' : 'headset'} size={18} color={Colors.success} />
            <Text style={styles.secondaryText}>{guideIndex >= 0 ? 'Stop guide' : 'Hear guide'}</Text>
          </PressableScale>
          <PressableScale style={styles.secondaryButton} onPress={() => toggleSongInSetlist(song.id)}>
            <Ionicons name={isInSet ? 'checkmark-circle' : 'list'} size={18} color={Colors.success} />
            <Text style={styles.secondaryText}>{isInSet ? 'In My set' : 'Add to My set'}</Text>
          </PressableScale>
        </View>

        {bestScore > 0 && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackScore}>Personal best · {bestScore}%</Text>
            <Text style={styles.feedbackText}>{songPracticeFeedback(bestScore)}</Text>
          </View>
        )}

        <PressableScale
          style={styles.startButton}
          onPress={() => { stopGuide(); saveOptions(song.id, options); onStart(options); }}
          accessibilityLabel={`Start ${song.title} practice`}
        >
          <Ionicons name="play" size={20} color="#071408" />
          <Text style={styles.startText}>Start listening practice</Text>
        </PressableScale>

        <View style={styles.communityCard}>
          <Text style={styles.communityTitle}>Community chart note</Text>
          <Text style={styles.communityCopy}>Found a wrong chord or have a clearer fingering tip? Submit it to the public project tracker for maintainer review, or share a local draft. Nothing posts automatically.</Text>
          <TextInput
            value={correction}
            onChangeText={setCorrection}
            placeholder="Example: bar 4 feels better as Am7…"
            placeholderTextColor={Colors.dark.muted}
            multiline
            style={styles.input}
            accessibilityLabel="Chart correction or playing tip"
          />
          <PressableScale style={[styles.submitButton, !correction.trim() && styles.disabled]} onPress={submitCorrection} disabled={!correction.trim()}>
            <Ionicons name="git-pull-request-outline" size={18} color="#071408" />
            <Text style={styles.submitText}>Submit for review</Text>
          </PressableScale>
          <PressableScale style={[styles.shareButton, !correction.trim() && styles.disabled]} onPress={shareCorrection} disabled={!correction.trim()}>
            <Ionicons name="share-outline" size={18} color={Colors.dark.text} />
            <Text style={styles.shareText}>Save and share elsewhere</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}

function OptionPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale style={[styles.pill, active && styles.pillActive]} onPress={onPress} accessibilityState={{ selected: active }}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingTop: 54, paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: Colors.dark.card },
  titleWrap: { flex: 1 },
  eyebrow: { color: Colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: Colors.dark.text, fontSize: 23, fontWeight: '900' },
  body: { padding: 18, paddingBottom: 110, gap: 13 },
  heroCard: { backgroundColor: Colors.dark.surfaceElevated, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  heroKey: { color: Colors.success, fontSize: 32, fontWeight: '900' },
  heroMeta: { color: Colors.dark.text, fontSize: 14, fontWeight: '800', marginTop: 3 },
  heroHint: { color: Colors.dark.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  sectionTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: '800', marginTop: 6 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 24, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  pillActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  pillText: { color: Colors.dark.muted, fontWeight: '800' },
  pillTextActive: { color: '#071408' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center' },
  stepValue: { flex: 1, minHeight: 58, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.surfaceElevated, borderRadius: 14 },
  stepValueMain: { color: Colors.dark.text, fontWeight: '900', fontSize: 17 },
  stepValueSub: { color: Colors.dark.muted, fontSize: 11, marginTop: 2 },
  easyButton: { minHeight: 48, borderRadius: 12, backgroundColor: 'rgba(255,193,7,0.10)', borderWidth: 1, borderColor: 'rgba(255,193,7,0.35)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  easyText: { color: Colors.warning, fontSize: 11, fontWeight: '800', flex: 1, textAlign: 'center' },
  timeline: { gap: 8, paddingVertical: 2 },
  eventChip: { width: 74, minHeight: 58, borderRadius: 12, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, alignItems: 'center', justifyContent: 'center' },
  eventChipActive: { borderColor: Colors.success, backgroundColor: 'rgba(76,175,80,0.16)' },
  eventLabel: { color: Colors.dark.text, fontWeight: '900', fontSize: 16 },
  eventLabelActive: { color: Colors.success },
  eventBeats: { color: Colors.dark.muted, fontSize: 10, marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: 8 },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.success, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: Colors.success, fontWeight: '800', fontSize: 12 },
  feedbackCard: { borderLeftWidth: 3, borderLeftColor: Colors.warning, backgroundColor: Colors.dark.card, padding: 14, borderRadius: 12 },
  feedbackScore: { color: Colors.warning, fontWeight: '900' },
  feedbackText: { color: Colors.dark.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  startButton: { minHeight: 54, borderRadius: 15, backgroundColor: Colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startText: { color: '#071408', fontSize: 15, fontWeight: '900' },
  communityCard: { marginTop: 8, backgroundColor: Colors.dark.card, borderRadius: 16, padding: 15, gap: 9 },
  communityTitle: { color: Colors.dark.text, fontWeight: '900', fontSize: 15 },
  communityCopy: { color: Colors.dark.muted, fontSize: 12, lineHeight: 17 },
  input: { minHeight: 78, color: Colors.dark.text, backgroundColor: Colors.dark.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 12, textAlignVertical: 'top' },
  shareButton: { minHeight: 48, borderRadius: 12, backgroundColor: Colors.dark.surfaceElevated, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareText: { color: Colors.dark.text, fontWeight: '800' },
  submitButton: { minHeight: 48, borderRadius: 12, backgroundColor: Colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#071408', fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
