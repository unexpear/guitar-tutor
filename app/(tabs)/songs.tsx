import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import ChordDiagram from '../../components/ChordDiagram';
import { SONGS, Song, Difficulty } from '../../features/songs/data/songs';
import {
  getChord,
  chordMidiNotes,
  midiToNoteName,
} from '../../features/chords/data/chords';
import { useGuitarSound } from '../../features/audio/hooks/useGuitarSound';
import { useRouter } from 'expo-router';

const DIFFICULTY_FILTERS: (Difficulty | 'All')[] = ['All', 'Easy', 'Medium', 'Hard'];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: '#4CAF50',
  Medium: '#FF9800',
  Hard: '#F44336',
};

// Deterministic per-artist cover-art tints (dark-theme friendly duotones).
const ART_PALETTE: { bg: string; fg: string }[] = [
  { bg: '#3E3A6B', fg: '#B7B0F0' },
  { bg: '#2E4A63', fg: '#9CC7EA' },
  { bg: '#553A5E', fg: '#DDA9E6' },
  { bg: '#2F5548', fg: '#9BDCC0' },
  { bg: '#5E4632', fg: '#EAC08F' },
  { bg: '#5A3540', fg: '#F0A3B5' },
  { bg: '#33525E', fg: '#A5D8E6' },
  { bg: '#4E4E33', fg: '#DCDC9B' },
];

function artForArtist(artist: string) {
  let hash = 0;
  for (let i = 0; i < artist.length; i++) {
    hash = (hash * 31 + artist.charCodeAt(i)) | 0;
  }
  return ART_PALETTE[Math.abs(hash) % ART_PALETTE.length];
}

function initialsFor(artist: string) {
  const words = artist.replace(/^The\s+/i, '').split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

function SongDetail({ song, onClose }: { song: Song; onClose: () => void }) {
  const color = Colors.dark;
  const { playChord } = useGuitarSound();
  const router = useRouter();
  const art = artForArtist(song.artist);

  // The two chords a song opens on are the change you will hit first and
  // most often, so that is the pair worth drilling.
  const practisePair = song.chords.slice(0, 2);
  const canPractise = practisePair.length === 2;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.detailOverlay}>
      <Pressable
        style={styles.detailBackdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <Animated.View entering={FadeInDown.springify()} style={styles.detailSheet}>
        <View style={styles.detailHandle} />

        <View style={styles.detailHead}>
          <View style={[styles.detailArt, { backgroundColor: art.bg }]}>
            <Text style={[styles.artInitials, { color: art.fg }]}>
              {initialsFor(song.artist)}
            </Text>
          </View>
          <View style={styles.detailHeadText}>
            <Text style={styles.detailTitle} numberOfLines={2}>
              {song.title}
            </Text>
            <Text style={styles.detailArtist} numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
        </View>

        <View style={styles.detailFacts}>
          <View style={styles.detailFact}>
            <Text style={styles.detailFactLabel}>KEY</Text>
            <Text style={styles.detailFactValue}>{song.key}</Text>
          </View>
          <View style={styles.detailFact}>
            <Text style={styles.detailFactLabel}>CAPO</Text>
            <Text style={styles.detailFactValue}>
              {song.capo ? `Fret ${song.capo}` : 'None'}
            </Text>
          </View>
          <View style={styles.detailFact}>
            <Text style={styles.detailFactLabel}>GENRE</Text>
            <Text style={styles.detailFactValue} numberOfLines={1}>
              {song.genre}
            </Text>
          </View>
          <View style={styles.detailFact}>
            <Text style={styles.detailFactLabel}>LEVEL</Text>
            <Text
              style={[
                styles.detailFactValue,
                { color: DIFFICULTY_COLORS[song.difficulty] },
              ]}
            >
              {song.difficulty}
            </Text>
          </View>
        </View>

        <Text style={styles.detailNote}>{song.note}</Text>

        <Text style={styles.detailSectionLabel}>
          CHORDS YOU NEED · {song.chords.length}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chordRow}
        >
          {song.chords.map((name) => {
            const chord = getChord(name);
            if (!chord) return null;
            return (
              <PressableScale
                key={name}
                style={styles.chordTile}
                onPress={() => playChord(chordMidiNotes(chord).map(midiToNoteName))}
                accessibilityRole="button"
                accessibilityLabel={`Hear ${name}`}
              >
                <ChordDiagram chord={chord} small />
                <Text style={styles.chordTileName}>{name}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>

        {canPractise && (
          <PressableScale
            style={styles.practiseBtn}
            onPress={() => {
              onClose();
              router.push(
                `/(tabs)/games?game=chord-changes&a=${encodeURIComponent(
                  practisePair[0]
                )}&b=${encodeURIComponent(practisePair[1])}`
              );
            }}
            accessibilityRole="button"
            accessibilityLabel={`Practise changing between ${practisePair[0]} and ${practisePair[1]}`}
          >
            <Ionicons name="repeat" size={18} color="#0b2410" />
            <Text style={styles.practiseBtnText}>
              Drill {practisePair[0]} ↔ {practisePair[1]}
            </Text>
          </PressableScale>
        )}

        <Text style={styles.detailFinePrint}>
          Chord reference only - tap a shape to hear it. Learn the arrangement
          from the record.
        </Text>

        <PressableScale onPress={onClose} style={styles.detailCloseBtn}>
          <Text style={[styles.detailCloseText, { color: color.muted }]}>Close</Text>
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

export default function SongLibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Difficulty | 'All'>('All');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const filteredSongs = SONGS.filter((song) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.genre.toLowerCase().includes(q) ||
      song.chords.some((c) => c.toLowerCase() === q);
    const matchesFilter = activeFilter === 'All' || song.difficulty === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const renderSongItem = ({ item }: { item: Song }) => {
    const art = artForArtist(item.artist);
    return (
      <PressableScale
        style={styles.songCard}
        onPress={() => setSelectedSong(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} by ${item.artist}, difficulty ${item.difficulty}, ${item.chords.length} chords`}
        accessibilityHint="Shows the chords this song uses"
      >
        <View style={[styles.artTile, { backgroundColor: art.bg }]}>
          <Ionicons
            name="musical-notes"
            size={34}
            color={art.fg}
            style={styles.artGlyph}
          />
          <Text style={[styles.artInitials, { color: art.fg }]}>
            {initialsFor(item.artist)}
          </Text>
        </View>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.artist}
          </Text>
          <View style={styles.songMeta}>
            <View
              style={[
                styles.difficultyDot,
                { backgroundColor: DIFFICULTY_COLORS[item.difficulty] },
              ]}
            />
            <Text
              style={[
                styles.difficultyText,
                { color: DIFFICULTY_COLORS[item.difficulty] },
              ]}
            >
              {item.difficulty}
            </Text>
            <Text style={styles.metaSeparator}>·</Text>
            <Text style={styles.songDuration}>{item.duration}</Text>
            <Text style={styles.metaSeparator}>·</Text>
            <Text style={styles.songDuration}>{item.chords.length} chords</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.dark.muted} />
      </PressableScale>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Song Library</Text>
        <Text style={styles.headerSubtitle}>{filteredSongs.length} songs</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.dark.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, genres, chords..."
          placeholderTextColor={Colors.dark.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search songs"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            accessibilityLabel="Clear search"
            hitSlop={10}
          >
            <Ionicons name="close-circle" size={18} color={Colors.dark.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterContainer}>
        {DIFFICULTY_FILTERS.map((filter) => (
          <PressableScale
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${filter}`}
            accessibilityState={{ selected: activeFilter === filter }}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter}
            </Text>
          </PressableScale>
        ))}
      </View>

      <FlatList
        data={filteredSongs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={48} color={Colors.dark.muted} />
            <Text style={styles.emptyText}>No songs found</Text>
          </View>
        }
      />

      {selectedSong && (
        <SongDetail song={selectedSong} onClose={() => setSelectedSong(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detailOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  detailSheet: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 14,
  },
  detailHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.cardBorder,
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailArt: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeadText: {
    flex: 1,
  },
  detailTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '800',
  },
  detailArtist: {
    color: Colors.dark.muted,
    fontSize: 14,
    marginTop: 2,
  },
  detailFacts: {
    flexDirection: 'row',
    gap: 10,
  },
  detailFact: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  detailFactLabel: {
    color: Colors.dark.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  detailFactValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  detailNote: {
    color: Colors.dark.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  detailSectionLabel: {
    color: Colors.dark.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  chordRow: {
    gap: 12,
    paddingRight: 12,
  },
  chordTile: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 4,
  },
  chordTileName: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
  practiseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 13,
    borderRadius: 12,
  },
  practiseBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0b2410',
  },
  detailFinePrint: {
    color: Colors.dark.muted,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.8,
  },
  detailCloseBtn: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  detailCloseText: {
    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.muted,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3e',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a3e',
  },
  filterButtonActive: {
    backgroundColor: Colors.success ?? '#6C63FF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.muted,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 8,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3e',
    borderRadius: 14,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    ...CARD_SHADOW,
  },
  artTile: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  artGlyph: {
    position: 'absolute',
    right: -7,
    bottom: -7,
    opacity: 0.28,
    transform: [{ rotate: '-12deg' }],
  },
  artInitials: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  songInfo: {
    flex: 1,
    marginRight: 10,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 13,
    color: Colors.dark.muted,
    marginBottom: 4,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaSeparator: {
    fontSize: 12,
    color: Colors.dark.muted,
    opacity: 0.6,
  },
  songDuration: {
    fontSize: 12,
    color: Colors.dark.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.muted,
  },
});
