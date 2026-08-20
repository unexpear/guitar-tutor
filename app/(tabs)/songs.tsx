import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: Difficulty;
  duration: string;
  genre: string;
}

const SONGS: Song[] = [
  { id: '1', title: "Knockin' on Heaven's Door", artist: 'Bob Dylan', difficulty: 'Easy', duration: '2:33', genre: 'Folk' },
  { id: '2', title: 'Horse with No Name', artist: 'America', difficulty: 'Easy', duration: '4:10', genre: 'Folk' },
  { id: '3', title: 'Love Me Do', artist: 'The Beatles', difficulty: 'Easy', duration: '2:23', genre: 'Classic Rock' },
  { id: '4', title: 'Stand By Me', artist: 'Ben E. King', difficulty: 'Easy', duration: '2:58', genre: 'Pop' },
  { id: '5', title: 'Riptide', artist: 'Vance Joy', difficulty: 'Easy', duration: '3:24', genre: 'Pop' },
  { id: '6', title: 'Wonderwall', artist: 'Oasis', difficulty: 'Medium', duration: '4:18', genre: 'Classic Rock' },
  { id: '7', title: 'Wish You Were Here', artist: 'Pink Floyd', difficulty: 'Medium', duration: '5:34', genre: 'Classic Rock' },
  { id: '8', title: 'Let It Be', artist: 'The Beatles', difficulty: 'Medium', duration: '4:03', genre: 'Classic Rock' },
  { id: '9', title: 'Hotel California', artist: 'Eagles', difficulty: 'Medium', duration: '6:30', genre: 'Classic Rock' },
  { id: '10', title: 'Hey Jude', artist: 'The Beatles', difficulty: 'Medium', duration: '7:11', genre: 'Classic Rock' },
  { id: '11', title: 'Nothing Else Matters', artist: 'Metallica', difficulty: 'Medium', duration: '6:28', genre: 'Classic Rock' },
  { id: '12', title: 'Stairway to Heaven', artist: 'Led Zeppelin', difficulty: 'Hard', duration: '8:02', genre: 'Classic Rock' },
  { id: '13', title: 'Comfortably Numb', artist: 'Pink Floyd', difficulty: 'Hard', duration: '6:24', genre: 'Classic Rock' },
  { id: '14', title: 'Free Bird', artist: 'Lynyrd Skynyrd', difficulty: 'Hard', duration: '9:08', genre: 'Classic Rock' },
  { id: '15', title: 'Bohemian Rhapsody', artist: 'Queen', difficulty: 'Hard', duration: '5:55', genre: 'Pop' },
];

const DIFFICULTY_FILTERS: (Difficulty | 'All')[] = ['All', 'Easy', 'Medium', 'Hard'];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: '#4CAF50',
  Medium: '#FF9800',
  Hard: '#F44336',
};

export default function SongLibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Difficulty | 'All'>('All');

  const filteredSongs = SONGS.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || song.difficulty === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const renderDifficultyBadge = (difficulty: Difficulty) => (
    <View
      style={[styles.badge, { backgroundColor: DIFFICULTY_COLORS[difficulty] }]}
      accessibilityLabel={`Difficulty: ${difficulty}`}
    >
      <Text style={styles.badgeText}>{difficulty}</Text>
    </View>
  );

  const renderSongItem = ({ item }: { item: Song }) => (
    <PressableScale
      style={styles.songCard}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} by ${item.artist}, difficulty ${item.difficulty}`}
    >
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
        <View style={styles.songMeta}>
          {renderDifficultyBadge(item.difficulty)}
          <Text style={styles.songDuration}>{item.duration}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.dark.muted} />
    </PressableScale>
  );

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
          placeholder="Search songs or artists..."
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 10,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a3e',
    borderRadius: 14,
    padding: 16,
    ...CARD_SHADOW,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  songArtist: {
    fontSize: 13,
    color: Colors.dark.muted,
    marginBottom: 8,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
