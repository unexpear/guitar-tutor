import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import FullGuitarSvg from './FullGuitarSvg';
import { GUITAR_DESIGNS, isDesignUnlocked } from '../../progression/guitarDesigns';
import { levelFromXp } from '../../progression/playerProgress';
import { useProgressStore } from '../../store/progressStore';
import { GUITAR_MODELS } from '../../progression/guitarModels';

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
  const selectedModels = useProgressStore((state) => state.selectedGuitarModelIds);
  const selectModel = useProgressStore((state) => state.selectGuitarModel);
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
        <Text style={styles.sectionTitle}>Guitar models</Text>
        <Text style={styles.sectionHelp}>Pick one acoustic and one electric shape. Every model is free.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelRow}>
          {GUITAR_MODELS.map((model) => {
            const active = selectedModels[model.guitarType] === model.id;
            const design = GUITAR_DESIGNS.find((item) => item.guitarType === model.guitarType)!;
            return (
              <PressableScale
                key={model.id}
                onPress={() => selectModel(model.id)}
                style={[styles.modelCard, active && styles.modelCardActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${model.name}, ${model.guitarType}${active ? ', equipped' : ''}`}
              >
                <FullGuitarSvg design={design} modelId={model.id} width={68} height={110} />
                <View style={styles.modelCopy}>
                  <Text style={styles.modelName}>{model.name}</Text>
                  <Text style={styles.modelType}>{model.guitarType}</Text>
                  <Text style={[styles.modelStatus, active && styles.modelStatusActive]}>{active ? 'EQUIPPED' : 'SELECT'}</Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
        <Text style={styles.sectionTitle}>Finishes</Text>
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
                accessibilityLabel={`${design.name} ${design.guitarType} guitar, ${open ? active ? 'selected' : 'unlocked' : `unlocks at level ${design.unlockLevel}`}`}
              >
                <View style={styles.preview}>
                  <FullGuitarSvg design={design} modelId={selectedModels[design.guitarType]} width={88} height={148} />
                  {!open && <View style={styles.lock}><Ionicons name="lock-closed" size={22} color="#fff" /></View>}
                </View>
                <Text style={styles.name} numberOfLines={1}>{design.name}</Text>
                <Text style={[styles.rarity, { color: RARITY_COLOR[design.rarity] }]}>{design.rarity} · {design.guitarType === 'acoustic' ? 'Acoustic' : 'Electric'}</Text>
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
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: '900', marginBottom: 4 },
  sectionHelp: { color: Colors.dark.muted, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  modelRow: { gap: 10, paddingBottom: 20 },
  modelCard: { width: 190, minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.card, padding: 8 },
  modelCardActive: { borderColor: Colors.success, borderWidth: 2 },
  modelCopy: { flex: 1 },
  modelName: { color: Colors.dark.text, fontWeight: '900', fontSize: 12 },
  modelType: { color: Colors.dark.muted, textTransform: 'capitalize', fontSize: 10, marginTop: 2 },
  modelStatus: { color: Colors.dark.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.6, marginTop: 8 },
  modelStatusActive: { color: Colors.success },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', minHeight: 242, borderRadius: 18, backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 12, alignItems: 'center' },
  cardActive: { borderColor: Colors.success, borderWidth: 2 },
  preview: { height: 152, justifyContent: 'center', position: 'relative' },
  lock: { position: 'absolute', left: 23, top: 55, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(5,6,14,0.82)', alignItems: 'center', justifyContent: 'center' },
  name: { color: Colors.dark.text, fontSize: 14, fontWeight: '900', maxWidth: '100%' },
  rarity: { fontSize: 12, fontWeight: '800', marginTop: 3 },
  requirement: { color: Colors.dark.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 6 },
});
