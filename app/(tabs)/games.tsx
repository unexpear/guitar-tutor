import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import { useProgressStore } from '../../features/store/progressStore';
import ChordQuizGame, {
  CHORD_QUIZ_ID,
} from '../../features/games/chordQuiz/ChordQuizGame';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  color: string;
  /** False while a game is still just a card. */
  playable?: boolean;
}

const GAMES: Game[] = [
  {
    id: 'chord-quiz',
    title: 'Chord Quiz',
    description: 'Identify chords by sight and sound',
    icon: '🧠',
    difficulty: 'Beginner',
    color: '#6C63FF',
    playable: true,
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
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const highScores = useProgressStore((s) => s.gameHighScores);
  const cardGap = 14;
  const sidePadding = 20;
  const cardWidth = (width - sidePadding * 2 - cardGap) / 2;

  const handleGamePress = useCallback((game: Game) => {
    if (game.playable) {
      setActiveGame(game.id);
      return;
    }
    Alert.alert(
      game.title,
      'This one is not built yet. Chord Quiz is - give it a go.',
      [{ text: 'OK' }],
    );
  }, []);

  const renderGameCard = (game: Game) => (
    <PressableScale
      key={game.id}
      style={[styles.gameCard, { width: cardWidth }, !game.playable && styles.gameCardSoon]}
      onPress={() => handleGamePress(game)}
      accessibilityRole="button"
      accessibilityLabel={`${game.title}: ${game.description}. Difficulty ${game.difficulty}${
        game.playable ? '' : '. Not built yet'
      }`}
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
      <View style={styles.cardFooter}>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: DIFFICULTY_BADGE_COLORS[game.difficulty] },
          ]}
        >
          <Text style={styles.difficultyText}>{game.difficulty}</Text>
        </View>
        {game.playable ? (
          highScores[game.id] > 0 && (
            <Text style={styles.bestScore}>Best {highScores[game.id]}</Text>
          )
        ) : (
          <Text style={styles.soonLabel}>Soon</Text>
        )}
      </View>
    </PressableScale>
  );

  if (activeGame === CHORD_QUIZ_ID) {
    return <ChordQuizGame onExit={() => setActiveGame(null)} />;
  }

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
  gameCardSoon: {
    opacity: 0.55,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  bestScore: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  soonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.muted,
    opacity: 0.7,
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
