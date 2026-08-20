import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  color: string;
}

const GAMES: Game[] = [
  {
    id: 'chord-quiz',
    title: 'Chord Quiz',
    description: 'Identify chords by sight and sound',
    icon: '🧠',
    difficulty: 'Beginner',
    color: '#6C63FF',
  },
  {
    id: 'scale-sprint',
    title: 'Scale Sprint',
    description: 'Race through scales as fast as you can',
    icon: '⚡',
    difficulty: 'Intermediate',
    color: '#FF6B6B',
  },
  {
    id: 'ear-training',
    title: 'Ear Training',
    description: 'Train your ear to recognize intervals',
    icon: '👂',
    difficulty: 'Intermediate',
    color: '#4ECDC4',
  },
  {
    id: 'rhythm-master',
    title: 'Rhythm Master',
    description: 'Master complex rhythm patterns',
    icon: '🥁',
    difficulty: 'Advanced',
    color: '#FFD93D',
  },
  {
    id: 'fretboard-explorer',
    title: 'Fretboard Explorer',
    description: 'Learn notes across the entire fretboard',
    icon: '🎸',
    difficulty: 'Beginner',
    color: '#A8E6CF',
  },
  {
    id: 'speed-challenge',
    title: 'Speed Challenge',
    description: 'Test your picking speed and accuracy',
    icon: '🏎️',
    difficulty: 'Advanced',
    color: '#FF8A5B',
  },
];

const DIFFICULTY_BADGE_COLORS: Record<Difficulty, string> = {
  Beginner: '#4CAF50',
  Intermediate: '#FF9800',
  Advanced: '#F44336',
};

export default function PracticeGamesScreen() {
  const { width } = useWindowDimensions();
  const cardGap = 14;
  const sidePadding = 20;
  const cardWidth = (width - sidePadding * 2 - cardGap) / 2;

  const handleGamePress = useCallback((game: Game) => {
    Alert.alert(
      game.title,
      'This game is coming soon! Stay tuned for updates.',
      [{ text: 'OK' }],
    );
  }, []);

  const renderGameCard = (game: Game) => (
    <PressableScale
      key={game.id}
      style={[styles.gameCard, { width: cardWidth }]}
      onPress={() => handleGamePress(game)}
      accessibilityRole="button"
      accessibilityLabel={`${game.title}: ${game.description}. Difficulty ${game.difficulty}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: game.color + '20' }]}>
        <Text style={styles.gameIcon}>{game.icon}</Text>
      </View>
      <Text style={styles.gameTitle} numberOfLines={1}>
        {game.title}
      </Text>
      <Text style={styles.gameDescription} numberOfLines={2}>
        {game.description}
      </Text>
      <View
        style={[
          styles.difficultyBadge,
          { backgroundColor: DIFFICULTY_BADGE_COLORS[game.difficulty] },
        ]}
      >
        <Text style={styles.difficultyText}>{game.difficulty}</Text>
      </View>
    </PressableScale>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice Games</Text>
        <Text style={styles.headerSubtitle}>Sharpen your skills with fun challenges</Text>
      </View>

      <View style={[styles.grid, { paddingHorizontal: sidePadding }]}>
        {GAMES.map((game) => renderGameCard(game))}
      </View>
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
    paddingBottom: 20,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  gameCard: {
    backgroundColor: '#1a1a3e',
    borderRadius: 16,
    padding: 16,
    ...CARD_SHADOW,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameIcon: {
    fontSize: 24,
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 12,
    color: Colors.dark.muted,
    lineHeight: 17,
    marginBottom: 12,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
