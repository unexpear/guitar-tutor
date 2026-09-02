import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import HeadstockSvg from '../../tuner/components/HeadstockSvg';
import { GUITAR_DESIGNS, isDesignUnlocked } from '../../progression/guitarDesigns';
import { levelFromXp } from '../../progression/playerProgress';
import { useProgressStore } from '../../store/progressStore';

const RARITY_COLOR = {
  Starter: Colors.success,
  Rare: '#64B5F6',
  Epic: '#C084FC',
  Legendary: '#FFD166',
};

export default function GuitarLocker({ onExit }: { onExit: () => void }) {
  const totalXp = useProgressStore((state) => state.totalXp);
  const selected = useProgressStore((state) => state.selectedGuitarDesignId);
  const select = useProgressStore((state) => state.selectGuitarDesign);
  const level = levelFromXp(totalXp);
  const unlocked = GUITAR_DESIGNS.filter((design) => isDesignUnlocked(design, level)).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={onExit} style={styles.close} accessibilityRole="button" accessibilityLabel="Close locker"><Ionicons name="close" size={23} color={Colors.dark.text} /></PressableScale>
        <View><Text style={styles.title}>Guitar Locker</Text><Text style={styles.subtitle}>{unlocked}/40 collected · Level {level}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        <Text style={styles.help}>Your first 10 finishes are free. Earn XP by finishing games and lessons; every new level unlocks another design. Cosmetics never lock learning.</Text>
        <View style={styles.cards}>
          {GUITAR_DESIGNS.map((design) => {
            const open = isDesignUnlocked(design, level);
            const active = selected === design.id;
            return (
              <PressableScale
                key={design.id}
                onPress={() => open && select(design.id)}
                disabled={!open}
                style={[styles.card, active && styles.cardActive, CARD_SHADOW]}
                accessibilityRole="button"
                accessibilityLabel={`${design.name}, ${open ? active ? 'selected' : 'unlocked' : `unlocks at level ${design.unlockLevel}`}`}
              >
                <View style={styles.preview}>
                  <HeadstockSvg design={design} width={76} height={122} />
                  {!open && <View style={styles.lock}><Ionicons name="lock-closed" size={22} color="#fff" /></View>}
                </View>
                <Text style={styles.name} numberOfLines={1}>{design.name}</Text>
                <Text style={[styles.rarity, { color: RARITY_COLOR[design.rarity] }]}>{design.rarity}</Text>
                <Text style={styles.requirement}>{open ? active ? 'EQUIPPED' : 'Tap to equip' : `LEVEL ${design.unlockLevel}`}</Text>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.surfaceElevated },
  title: { color: Colors.dark.text, fontSize: 23, fontWeight: '900' },
  subtitle: { color: Colors.success, fontWeight: '700', marginTop: 3 },
  grid: { padding: 18, paddingBottom: 120 },
  help: { color: Colors.dark.muted, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', minHeight: 218, borderRadius: 18, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 12, alignItems: 'center' },
  cardActive: { borderColor: Colors.success, borderWidth: 2 },
  preview: { height: 126, justifyContent: 'center', position: 'relative' },
  lock: { position: 'absolute', left: 17, top: 43, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(5,6,14,0.82)', alignItems: 'center', justifyContent: 'center' },
  name: { color: Colors.dark.text, fontSize: 14, fontWeight: '900', maxWidth: '100%' },
  rarity: { fontSize: 12, fontWeight: '800', marginTop: 3 },
  requirement: { color: Colors.dark.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 6 },
});

