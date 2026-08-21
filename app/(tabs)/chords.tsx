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

type ChordType = 'major' | 'minor' | '7th' | 'minor7th' | 'major7th' | 'dim';

interface Chord {
  name: string;
  type: ChordType;
  strings: number[];
  fingers: number[];
}

// `strings` and `fingers` are ordered low E -> high e (index 0 = 6th string).
// -1 = muted, 0 = open.
const CHORDS: Chord[] = [
  // Major
  { name: 'A', type: 'major', strings: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  { name: 'B', type: 'major', strings: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] },
  { name: 'C', type: 'major', strings: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  { name: 'D', type: 'major', strings: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  { name: 'E', type: 'major', strings: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { name: 'F', type: 'major', strings: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
  { name: 'G', type: 'major', strings: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },

  // Minor
  { name: 'Am', type: 'minor', strings: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  { name: 'Bm', type: 'minor', strings: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] },
  { name: 'Cm', type: 'minor', strings: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] },
  { name: 'Dm', type: 'minor', strings: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  { name: 'Em', type: 'minor', strings: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  { name: 'Fm', type: 'minor', strings: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
  { name: 'Gm', type: 'minor', strings: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] },

  // 7th
  { name: 'A7', type: '7th', strings: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  { name: 'B7', type: '7th', strings: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  { name: 'C7', type: '7th', strings: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  { name: 'D7', type: '7th', strings: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  { name: 'E7', type: '7th', strings: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  { name: 'G7', type: '7th', strings: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },

  // Minor 7th
  { name: 'Am7', type: 'minor7th', strings: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  { name: 'Dm7', type: 'minor7th', strings: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  { name: 'Em7', type: 'minor7th', strings: [0, 2, 2, 0, 3, 0], fingers: [0, 2, 3, 0, 4, 0] },

  // Major 7th
  { name: 'Cmaj7', type: 'major7th', strings: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  { name: 'Fmaj7', type: 'major7th', strings: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  { name: 'Gmaj7', type: 'major7th', strings: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3] },

  // Diminished
  { name: 'Adim', type: 'dim', strings: [-1, 0, 1, 2, 1, -1], fingers: [0, 0, 1, 3, 2, 0] },
  { name: 'Bdim', type: 'dim', strings: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0] },
  { name: 'Edim', type: 'dim', strings: [-1, -1, 2, 3, 5, 3], fingers: [0, 0, 1, 2, 4, 3] },
];

const CHORD_TYPE_LABELS: Record<ChordType, string> = {
  major: 'Major',
  minor: 'Minor',
  '7th': '7th',
  minor7th: 'm7',
  major7th: 'Maj7',
  dim: 'Dim',
};

const CHORD_TYPE_ORDER: ChordType[] = ['major', 'minor', '7th', 'minor7th', 'major7th', 'dim'];

const FRETBOARD_STRING_COUNT = 6;
const FRET_COUNT = 5;

function ChordDiagram({ chord, small }: { chord: Chord; small?: boolean }) {
  const color = Colors.dark;
  // Finger-dot radius drives all other proportions.
  const dotR = small ? 7 : 14;
  const boardW = small ? 82 : 150;
  const boardH = small ? 92 : 168;
  const nutH = small ? 5 : 7;
  const markerH = small ? 17 : 26; // X / O row above the nut
  const lineW = small ? 1.5 : 2;
  const cellH = boardH / FRET_COUNT;
  const cellW = boardW / (FRETBOARD_STRING_COUNT - 1);
  const pad = dotR + 1; // room for dots on the outer strings
  const gridColor = color.muted;
  const boardTop = markerH + nutH;
  const openR = small ? 4.5 : 8;

  return (
    <View style={{ width: boardW + pad * 2, height: boardTop + boardH + lineW }}>
      {/* Nut — bold bar across the top */}
      <View
        style={{
          position: 'absolute',
          top: markerH,
          left: pad - lineW,
          width: boardW + lineW * 2,
          height: nutH,
          borderRadius: nutH / 3,
          backgroundColor: color.tint,
        }}
      />
      {/* Frets */}
      {[...Array(FRET_COUNT)].map((_, i) => (
        <View
          key={`fret-${i}`}
          style={{
            position: 'absolute',
            top: boardTop + (i + 1) * cellH - lineW,
            left: pad,
            width: boardW,
            height: lineW,
            backgroundColor: gridColor,
          }}
        />
      ))}
      {/* Strings */}
      {[...Array(FRETBOARD_STRING_COUNT)].map((_, i) => (
        <View
          key={`string-${i}`}
          style={{
            position: 'absolute',
            left: pad + i * cellW - lineW / 2,
            top: boardTop,
            height: boardH,
            width: lineW,
            backgroundColor: gridColor,
          }}
        />
      ))}
      {chord.strings.map((fret, stringIdx) => {
        const cx = pad + stringIdx * cellW;
        if (fret === -1) {
          return (
            <Text
              key={`x-${stringIdx}`}
              style={{
                position: 'absolute',
                left: cx - dotR,
                top: 0,
                width: dotR * 2,
                height: markerH,
                lineHeight: markerH - (small ? 3 : 4),
                textAlign: 'center',
                color: color.text,
                fontSize: small ? 12 : 18,
                fontWeight: '800',
              }}
            >
              ×
            </Text>
          );
        }
        if (fret === 0) {
          return (
            <View
              key={`open-${stringIdx}`}
              style={{
                position: 'absolute',
                left: cx - openR,
                top: (markerH - nutH) / 2 - openR,
                width: openR * 2,
                height: openR * 2,
                borderRadius: openR,
                borderWidth: small ? 1.5 : 2,
                borderColor: color.text,
                backgroundColor: 'transparent',
              }}
            />
          );
        }
        const finger = chord.fingers[stringIdx];
        return (
          <View
            key={`dot-${stringIdx}`}
            style={{
              position: 'absolute',
              left: cx - dotR,
              top: boardTop + (fret - 0.5) * cellH - dotR,
              width: dotR * 2,
              height: dotR * 2,
              borderRadius: dotR,
              backgroundColor: Colors.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {finger > 0 && (
              <Text
                style={{
                  color: color.background,
                  fontSize: small ? 10 : 15,
                  fontWeight: '800',
                  lineHeight: small ? 13 : 19,
                }}
              >
                {finger}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

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

        <PressableScale onPress={onClose} style={[styles.detailCloseBtn, { backgroundColor: color.tint }]}>
          <Text style={styles.detailCloseText}>Close</Text>
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
  const [selectedChord, setSelectedChord] = useState<Chord | null>(null);

  const numColumns = width >= 600 ? 4 : width >= 400 ? 3 : 2;
  const gridGap = numColumns >= 4 ? 10 : 12;
  // Full-bleed grid: subtract the list's horizontal padding (16 each side)
  // and the inter-card gaps so the columns span the same width as the
  // search bar above.
  const cardWidth = Math.floor((width - 32 - gridGap * (numColumns - 1)) / numColumns);

  const filtered = useMemo(() => {
    let result = CHORDS;
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
  }, [search, activeFilter]);

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
          active={activeFilter === null}
          onPress={() => setActiveFilter(null)}
        />
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
          <Text style={[styles.emptyTitle, { color: color.text }]}>No chords found</Text>
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
  detailCloseBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  detailCloseText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
