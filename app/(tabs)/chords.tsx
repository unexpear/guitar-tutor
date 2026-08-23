import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, CARD_SHADOW } from '../../constants/Colors';
import PressableScale from '../../components/PressableScale';
import ChordDiagram from '../../components/ChordDiagram';
import {
  CHORDS,
  Chord,
  ChordType,
  chordMidiNotes,
  midiToNoteName,
} from '../../features/chords/data/chords';
import { useGuitarSound } from '../../features/audio/hooks/useGuitarSound';
import { useProgressStore } from '../../features/store/progressStore';
import {
  accuracy,
  verdictFor,
  ChordVerdict,
} from '../../features/practice/chordStats';

const VERDICT_LABELS: Record<ChordVerdict, string> = {
  untried: 'Not practised yet',
  learning: 'Learning',
  shaky: 'Needs work',
  solid: 'Solid',
};

const VERDICT_COLORS: Record<ChordVerdict, string> = {
  untried: Colors.dark.muted,
  learning: Colors.dark.muted,
  shaky: Colors.warning,
  solid: Colors.success,
};

const CHORD_TYPE_LABELS: Record<ChordType, string> = {
  major: 'Major',
  minor: 'Minor',
  '7th': '7th',
  minor7th: 'm7',
  major7th: 'Maj7',
  dim: 'Dim',
};

const CHORD_TYPE_ORDER: ChordType[] = ['major', 'minor', '7th', 'minor7th', 'major7th', 'dim'];


function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const color = Colors.dark;
  return (
    <PressableScale
      onPress={onPress}
      scale={0.94}
      style={[
        styles.filterBtn,
        {
          backgroundColor: active ? Colors.success : color.surface,
          borderColor: active ? Colors.success : color.cardBorder,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter by ${label}`}
    >
      <Text style={[styles.filterText, { color: active ? '#fff' : color.text }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

function ChordCard({
  chord,
  onPress,
  index,
  cardWidth,
}: {
  chord: Chord;
  onPress: () => void;
  index: number;
  cardWidth: number;
}) {
  const color = Colors.dark;
  return (
    <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
      <PressableScale onPress={onPress} scale={0.96} style={[styles.card, CARD_SHADOW, { width: cardWidth }]}>
        <ChordDiagram chord={chord} small />
        <Text style={[styles.cardName, { color: color.text }]}>{chord.name}</Text>
        <Text style={[styles.cardType, { color: color.muted }]}>
          {CHORD_TYPE_LABELS[chord.type]}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

function DetailView({ chord, onClose }: { chord: Chord; onClose: () => void }) {
  const color = Colors.dark;
  const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];
  const { playChord } = useGuitarSound();
  const favoriteChords = useProgressStore((s) => s.favoriteChords);
  const addFavoriteChord = useProgressStore((s) => s.addFavoriteChord);
  const removeFavoriteChord = useProgressStore((s) => s.removeFavoriteChord);
  const isFavorite = favoriteChords.includes(chord.name);
  const stat = useProgressStore((s) => s.chordStats[chord.name]);
  const verdict = verdictFor(stat);
  const acc = accuracy(stat);

  // Low string to high, so the strum runs in the direction of a downstroke.
  const handlePlay = () =>
    playChord(chordMidiNotes(chord).map(midiToNoteName));

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.detailOverlay}>
      <Pressable style={styles.detailBackdrop} onPress={onClose} />
      <Animated.View
        entering={FadeInDown.springify()}
        style={[styles.detailSheet, { backgroundColor: color.surfaceElevated }]}
      >
        <View style={styles.detailHandle} />
        <Text style={[styles.detailName, { color: color.text }]}>{chord.name}</Text>
        <Text style={[styles.detailType, { color: color.muted }]}>
          {CHORD_TYPE_LABELS[chord.type]}
        </Text>
        <Text style={[styles.detailStat, { color: VERDICT_COLORS[verdict] }]}>
          {verdict === 'untried'
            ? 'Not practised yet'
            : verdict === 'learning'
            ? `${stat?.attempts} ${stat?.attempts === 1 ? 'try' : 'tries'} so far`
            : `${VERDICT_LABELS[verdict]} · ${acc}% of ${stat?.attempts}`}
        </Text>

        <View style={styles.detailDiagramWrap}>
          <ChordDiagram chord={chord} />
        </View>

        <View style={styles.detailStrings}>
          {stringNames.map((s, i) => {
            const fret = chord.strings[i];
            const finger = chord.fingers[i];
            return (
              <View key={s} style={styles.detailStringCol}>
                <Text style={[styles.detailStringLabel, { color: color.muted }]}>{s}</Text>
                <View
                  style={[
                    styles.detailDot,
                    {
                      backgroundColor: fret === -1 ? 'transparent' : fret === 0 ? 'transparent' : color.tint,
                      borderColor: fret === 0 ? color.tint : fret === -1 ? color.muted : 'transparent',
                    },
                  ]}
                >
                  {fret === -1 && <Text style={{ color: color.muted, fontSize: 12 }}>×</Text>}
                  {fret === 0 && <Text style={{ color: color.tint, fontSize: 11, fontWeight: '700' }}>O</Text>}
                  {fret > 0 && <Text style={{ color: '#000', fontSize: 11, fontWeight: '700' }}>{fret}</Text>}
                </View>
                <Text style={[styles.detailFingerLabel, { color: color.muted }]}>
                  {finger > 0 ? `F${finger}` : '—'}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.detailLegend}>
          1 index · 2 middle · 3 ring · 4 pinky
        </Text>
        <Text style={styles.detailLegend}>
          ○ play open · ✕ don&apos;t play · numbers down the side are frets
        </Text>

        <View style={styles.detailActions}>
          <PressableScale
            onPress={handlePlay}
            style={[styles.detailPlayBtn, { backgroundColor: color.tint }]}
            accessibilityRole="button"
            accessibilityLabel={`Hear ${chord.name}`}
          >
            <Ionicons name="play" size={18} color="#0f0f23" />
            <Text style={styles.detailPlayText}>Hear it</Text>
          </PressableScale>
          <PressableScale
            onPress={() =>
              isFavorite ? removeFavoriteChord(chord.name) : addFavoriteChord(chord.name)
            }
            style={[styles.detailFavBtn, { borderColor: isFavorite ? color.tint : color.cardBorder }]}
            accessibilityRole="button"
            accessibilityState={{ selected: isFavorite }}
            accessibilityLabel={
              isFavorite ? `Remove ${chord.name} from favourites` : `Save ${chord.name} to favourites`
            }
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={isFavorite ? color.tint : color.muted}
            />
          </PressableScale>
        </View>

        <PressableScale onPress={onClose} style={styles.detailCloseBtn}>
          <Text style={[styles.detailCloseText, { color: color.muted }]}>Close</Text>
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

export default function ChordsScreen() {
  const { width } = useWindowDimensions();
  const color = Colors.dark;
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChordType | null>(null);
  // Favourites are a filter rather than a type, since a chord can be both.
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [needsWorkOnly, setNeedsWorkOnly] = useState(false);
  const [selectedChord, setSelectedChord] = useState<Chord | null>(null);
  const favoriteChords = useProgressStore((s) => s.favoriteChords);
  const chordStats = useProgressStore((s) => s.chordStats);
  const shakyChords = useMemo(
    () => CHORDS.filter((c) => verdictFor(chordStats[c.name]) === 'shaky'),
    [chordStats]
  );
  const showNeedsWork = needsWorkOnly && shakyChords.length > 0;
  // Unstarring the last favourite hides the chip, so the filter must fall
  // back to off on its own or the user is stranded on an empty list with no
  // control left to switch it back.
  const showFavourites = favouritesOnly && favoriteChords.length > 0;

  const numColumns = width >= 600 ? 4 : width >= 400 ? 3 : 2;
  const gridGap = numColumns >= 4 ? 10 : 12;
  // Full-bleed grid: subtract the list's horizontal padding (16 each side)
  // and the inter-card gaps so the columns span the same width as the
  // search bar above.
  const cardWidth = Math.floor((width - 32 - gridGap * (numColumns - 1)) / numColumns);

  const filtered = useMemo(() => {
    let result: Chord[] = CHORDS;
    if (showFavourites) {
      result = result.filter((c) => favoriteChords.includes(c.name));
    }
    if (showNeedsWork) {
      result = result.filter((c) => shakyChords.some((x) => x.name === c.name));
    }
    if (activeFilter) {
      result = result.filter((c) => c.type === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, activeFilter, showFavourites, favoriteChords, showNeedsWork, shakyChords]);

  const grouped = useMemo(() => {
    const map = new Map<ChordType, Chord[]>();
    for (const chord of filtered) {
      const existing = map.get(chord.type) || [];
      existing.push(chord);
      map.set(chord.type, existing);
    }
    return map;
  }, [filtered]);

  const sections = useMemo(
    () =>
      CHORD_TYPE_ORDER
        .filter((t) => grouped.has(t))
        .map((t) => ({ type: t, data: grouped.get(t)! })),
    [grouped]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: color.background }]} edges={[]}>
      <View style={[styles.searchWrap, { backgroundColor: color.surface, borderColor: color.cardBorder }]}>
        <Ionicons name="search" size={16} color={color.muted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: color.text }]}
          placeholder="Search chords..."
          placeholderTextColor={color.muted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="characters"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={12}>
            <Ionicons name="close" size={18} color={color.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        <FilterButton
          label="All"
          active={activeFilter === null && !showFavourites && !showNeedsWork}
          onPress={() => {
            setActiveFilter(null);
            setFavouritesOnly(false);
            setNeedsWorkOnly(false);
          }}
        />
        {shakyChords.length > 0 && (
          <FilterButton
            label={`Needs work (${shakyChords.length})`}
            active={showNeedsWork}
            onPress={() => setNeedsWorkOnly((v) => !v)}
          />
        )}
        {favoriteChords.length > 0 && (
          <FilterButton
            label={`★ Saved (${favoriteChords.length})`}
            active={showFavourites}
            onPress={() => setFavouritesOnly((v) => !v)}
          />
        )}
        {CHORD_TYPE_ORDER.map((t) => (
          <FilterButton
            key={t}
            label={CHORD_TYPE_LABELS[t]}
            active={activeFilter === t}
            onPress={() => setActiveFilter(activeFilter === t ? null : t)}
          />
        ))}
      </ScrollView>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="guitar-acoustic"
            size={48}
            color={color.muted}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyTitle, { color: color.text }]}>
            {showFavourites
              ? 'No saved chords yet'
              : showNeedsWork
              ? 'Nothing needs work'
              : 'No chords found'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: color.muted }]}>
            Try a different search
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.type}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: color.muted }]}>
                {CHORD_TYPE_LABELS[section.type]}
              </Text>
              <View style={[styles.grid, { gap: gridGap }]}>
                {section.data.map((chord, i) => (
                  <ChordCard
                    key={chord.name}
                    chord={chord}
                    index={i}
                    cardWidth={cardWidth}
                    onPress={() => setSelectedChord(chord)}
                  />
                ))}
              </View>
            </View>
          )}
        />
      )}

      {selectedChord && (
        <DetailView chord={selectedChord} onClose={() => setSelectedChord(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  cardType: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
  },
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  detailHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.muted + '60',
    marginBottom: 20,
  },
  detailName: {
    fontSize: 28,
    fontWeight: '800',
  },
  detailType: {
    fontSize: 15,
    marginTop: 2,
    marginBottom: 24,
  },
  detailStat: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  detailDiagramWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  detailStrings: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 24,
    marginBottom: 28,
  },
  detailStringCol: {
    alignItems: 'center',
    gap: 6,
  },
  detailStringLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  detailFingerLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  detailLegend: {
    fontSize: 11,
    color: Colors.dark.muted,
    textAlign: 'center',
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  detailPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 12,
  },
  detailPlayText: {
    color: '#0f0f23',
    fontSize: 15,
    fontWeight: '700',
  },
  detailFavBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  detailCloseText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
