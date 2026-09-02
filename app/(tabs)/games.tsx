import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProgressStore } from '../../features/store/progressStore';
import ChordQuizGame, {
  CHORD_QUIZ_ID,
} from '../../features/games/chordQuiz/ChordQuizGame';
import ChordChangesGame, {
  CHORD_CHANGES_ID,
} from '../../features/games/chordChanges/ChordChangesGame';
import TrainingGame, { type TrainingGameId } from '../../features/games/training/TrainingGame';
import ProgressionBuilderGame from '../../features/games/progression/ProgressionBuilderGame';
import PlayAlongLesson from '../../features/lessons/playalong/PlayAlongLesson';
import { getDrill } from '../../features/lessons/data/drills';
import StarterArcadeGame from '../../features/games/starter/StarterArcadeGame';
import type { StarterGameId } from '../../features/games/starter/starterArcade';
import GuitarLocker from '../../features/games/locker/GuitarLocker';
import { levelProgress } from '../../features/progression/playerProgress';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  color: string;
  recommended?: boolean;
}

const GAMES: Game[] = [
  {
    id: 'string-scout',
    title: 'String Scout',
    description: 'Learn string names and numbers in quick rounds',
    icon: '🧭',
    difficulty: 'Beginner',
    color: '#4CAF50',
    recommended: true,
  },
  {
    id: 'tune-sense',
    title: 'Tune Sense',
    description: 'Learn flat, sharp and which way to tune',
    icon: '🎯',
    difficulty: 'Beginner',
    color: '#42A5F5',
    recommended: true,
  },
  {
    id: 'chord-quiz',
    title: 'Chord Quiz',
    description: 'Identify chords by sight and sound',
    icon: '🧠',
    difficulty: 'Beginner',
    color: '#6C63FF',
  },
  {
    id: CHORD_CHANGES_ID,
    title: 'Chord Changes',
    description: 'One minute, two chords, count the clean changes',
    icon: '🔁',
    difficulty: 'Beginner',
    color: '#4CAF50',
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
    id: 'progression-builder',
    title: 'Progression Builder',
    description: 'Build, hear and save your own chord loops',
    icon: '🎼',
    difficulty: 'Beginner',
    color: '#64B5F6',
  },
  {
    id: 'ear-training',
    title: 'Ear Training',
    description: 'Hear pitch distances with guided clues',
    icon: '👂',
    difficulty: 'Intermediate',
    color: '#4ECDC4',
  },
  {
    id: 'rhythm-master',
    title: 'Rhythm Master',
    description: 'Find the pulse, then tap eight steady beats',
    icon: '🥁',
    difficulty: 'Intermediate',
    color: '#FFD93D',
  },
  {
    id: 'scale-sprint',
    title: 'Scale Sprint',
    description: 'Play a C major scale with live pitch scoring',
    icon: '⚡',
    difficulty: 'Intermediate',
    color: '#FF6B6B',
  },
  {
    id: 'speed-challenge',
    title: 'Speed Challenge',
    description: 'Run the pentatonic box with live pitch scoring',
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
  const router = useRouter();
  // Another screen can deep-link straight into a game, e.g. the Songs tab
  // sending you to practise the changes in a song.
  const params = useLocalSearchParams<{ game?: string; a?: string; b?: string }>();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  useEffect(() => {
    if (params.game) setActiveGame(params.game);
  }, [params.game]);

  const closeGame = useCallback(() => {
    setActiveGame(null);
    // Otherwise the param would reopen the game the moment the tab renders.
    if (params.game) router.setParams({ game: undefined, a: undefined, b: undefined });
  }, [params.game, router]);
  const highScores = useProgressStore((s) => s.gameHighScores);
  const totalXp = useProgressStore((s) => s.totalXp);
  const gamePlays = useProgressStore((s) => s.gamePlays);
  const recordGameScore = useProgressStore((s) => s.recordGameScore);
  const playerLevel = levelProgress(totalXp);
  const roundsPlayed = Object.values(gamePlays).reduce((sum, count) => sum + count, 0);
  const recordsSet = Object.keys(highScores).length;
  const activeDrill = useMemo(() => {
    if (activeGame === 'scale-sprint') return getDrill('intermediate-scales-101');
    if (activeGame === 'speed-challenge') return getDrill('advanced-improvisation');
    return undefined;
  }, [activeGame]);

  // Chord Changes keeps a best per chord pair, so the card shows the best of
  // them rather than a single game-wide number.
  const bestFor = useCallback(
    (gameId: string) => {
      if (gameId !== CHORD_CHANGES_ID) return highScores[gameId] ?? 0;
      const pairs = Object.entries(highScores)
        .filter(([key]) => key.startsWith(`${CHORD_CHANGES_ID}:`))
        .map(([, value]) => value);
      return pairs.length ? Math.max(...pairs) : 0;
    },
    [highScores]
  );
  const cardGap = 14;
  const sidePadding = 20;
  const columns = width >= 1000 ? 4 : width >= 700 ? 3 : 2;
  const cardWidth = Math.min(
    280,
    (width - sidePadding * 2 - cardGap * (columns - 1)) / columns,
  );

  const handleGamePress = useCallback((game: Game) => {
    setActiveGame(game.id);
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
      <View style={styles.cardFooter}>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: DIFFICULTY_BADGE_COLORS[game.difficulty] },
          ]}
        >
          <Text style={styles.difficultyText}>{game.difficulty}</Text>
        </View>
        {bestFor(game.id) > 0 ? (
          <Text style={styles.bestScore}>Best {bestFor(game.id)}</Text>
        ) : game.recommended ? <Text style={styles.startHere}>START HERE</Text> : null}
      </View>
    </PressableScale>
  );

  if (activeGame === CHORD_QUIZ_ID) {
    return <ChordQuizGame onExit={closeGame} />;
  }
  if (activeGame === CHORD_CHANGES_ID) {
    return (
      <ChordChangesGame
        onExit={closeGame}
        initialPair={params.a && params.b ? [params.a, params.b] : undefined}
      />
    );
  }
  if (activeGame === 'ear-training' || activeGame === 'rhythm-master' || activeGame === 'fretboard-explorer') {
    return <TrainingGame gameId={activeGame as TrainingGameId} onExit={closeGame} />;
  }
  if (activeGame === 'progression-builder') {
    return <ProgressionBuilderGame onExit={closeGame} />;
  }
  if (activeGame === 'string-scout' || activeGame === 'tune-sense') {
    return <StarterArcadeGame gameId={activeGame as StarterGameId} onExit={closeGame} />;
  }
  if (activeGame === 'guitar-locker') {
    return <GuitarLocker onExit={closeGame} />;
  }
  if (activeDrill && activeGame) {
    return (
      <PlayAlongLesson
        drill={activeDrill}
        onClose={closeGame}
        onFinish={(score) => recordGameScore(activeGame, score)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice Games</Text>
        <Text style={styles.headerSubtitle}>New here? Start with String Scout, then Tune Sense.</Text>
        <PressableScale
          onPress={() => setActiveGame('guitar-locker')}
          style={styles.playerCard}
          accessibilityRole="button"
          accessibilityLabel={`Level ${playerLevel.level}. Open Guitar Locker.`}
        >
          <View style={styles.levelBadge}><Text style={styles.levelNumber}>{playerLevel.level}</Text></View>
          <View style={styles.playerProgress}>
            <View style={styles.playerLine}><Text style={styles.playerTitle}>LEVEL {playerLevel.level}</Text><Text style={styles.lockerLink}>Guitar Locker ›</Text></View>
            <View style={styles.xpTrack}><View style={[styles.xpFill, { width: `${playerLevel.percent}%` }]} /></View>
            <Text style={styles.playerMeta}>{playerLevel.xpIntoLevel}/{playerLevel.xpForNextLevel} XP · {roundsPlayed} rounds · {recordsSet} records</Text>
          </View>
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingHorizontal: sidePadding }]}
        showsVerticalScrollIndicator={false}
      >
        {GAMES.map((game) => renderGameCard(game))}
      </ScrollView>
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
    paddingBottom: 32,
  },
  playerCard: { marginTop: 18, minHeight: 92, borderRadius: 18, borderWidth: 1, borderColor: '#343760', backgroundColor: '#1a1a3e', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13, ...CARD_SHADOW },
  levelBadge: { width: 58, height: 58, borderRadius: 17, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  levelNumber: { color: '#071408', fontSize: 27, fontWeight: '900' },
  playerProgress: { flex: 1, gap: 7 },
  playerLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerTitle: { color: Colors.dark.text, fontWeight: '900', letterSpacing: 1 },
  lockerLink: { color: Colors.success, fontWeight: '800', fontSize: 12 },
  xpTrack: { height: 7, borderRadius: 4, backgroundColor: '#34365B', overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.success },
  playerMeta: { color: Colors.dark.muted, fontSize: 11, fontWeight: '600' },
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
  startHere: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7, color: Colors.warning },
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
