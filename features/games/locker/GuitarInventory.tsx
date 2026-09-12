import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from '../../../components/PressableScale';
import { Colors } from '../../../constants/Colors';
import { guitarModel } from '../../progression/guitarModels';
import { useGuitarRewardStore } from '../../store/guitarRewardStore';
import Guitar3D from '../../tuner/components/Guitar3D';
import RewardStorageNotice from './RewardStorageNotice';

/** Saved rewards, distinct from the catalog of bodies and level finishes. */
export default function GuitarInventory() {
  const collection = useGuitarRewardStore(s => s.collection);
  const equippedId = useGuitarRewardStore(s => s.equippedId);
  const equip = useGuitarRewardStore(s => s.equip);
  const [visibleCount, setVisibleCount] = useState(12);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const visible = collection.slice().reverse().slice(0, visibleCount);
  return <View style={styles.inventory}>
    <Text accessibilityRole="header" style={styles.title}>My guitar inventory · {collection.length}</Text>
    <RewardStorageNotice />
    <Text style={styles.copy}>Your daily gifts appear here, newest first. An equipped gift appears when tuning its matching acoustic or electric instrument. Switching never removes a guitar.</Text>
    {collection.length === 0 && <Text style={styles.copy}>No gifts collected yet. Open your free daily gift in the Guitar Locker to add your first guitar.</Text>}
    {visible.map(guitar => {
      const active = equippedId === guitar.id;
      return <View key={guitar.id} style={[styles.item, active && styles.active]}>
        <Text style={styles.title}>{guitar.design.name}</Text>
        <Text style={styles.copy}>{guitarModel(guitar.modelId)?.name ?? guitar.modelId} · {guitar.design.rarity === 'Starter' ? 'Common' : guitar.design.rarity}</Text>
        <Text style={styles.copy}>Collected {guitar.date}</Text>
        {previewId === guitar.id && <View style={styles.preview}><Guitar3D design={guitar.design} modelId={guitar.modelId} /></View>}
        <View style={styles.actions}>
          <PressableScale accessibilityRole="button" accessibilityLabel={`${previewId === guitar.id ? 'Close preview of' : 'Preview'} ${guitar.design.name}`} onPress={() => setPreviewId(previewId === guitar.id ? null : guitar.id)} style={styles.button}><Text style={styles.copy}>{previewId === guitar.id ? 'Close preview' : 'Preview'}</Text></PressableScale>
          <PressableScale accessibilityRole="button" accessibilityLabel={`Equip ${guitar.design.name}`} accessibilityState={{ selected: active }} onPress={() => equip(guitar.id)} style={styles.button}><Text style={[styles.copy, active && styles.equipped]}>{active ? 'Equipped in tuner' : 'Equip in tuner'}</Text></PressableScale>
        </View>
      </View>;
    })}
    {collection.length > visibleCount && <PressableScale accessibilityRole="button" onPress={() => setVisibleCount(count => count + 12)} style={styles.button}><Text style={styles.copy}>Show more guitars ({collection.length - visibleCount} remaining)</Text></PressableScale>}
    {equippedId && <PressableScale accessibilityRole="button" onPress={() => equip(null)} style={styles.button}><Text style={styles.copy}>Use my normal model and finish</Text></PressableScale>}
  </View>;
}
const styles = StyleSheet.create({
  inventory: { width: '100%', gap: 10, marginVertical: 16 },
  title: { color: Colors.dark.text, fontWeight: '800', fontSize: 16 },
  copy: { color: Colors.dark.muted, fontSize: 13, lineHeight: 19 },
  item: { borderWidth: 1, borderColor: Colors.dark.cardBorder, borderRadius: 14, padding: 12, gap: 6, backgroundColor: Colors.dark.card },
  active: { borderColor: Colors.success },
  equipped: { color: Colors.success, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, padding: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: Colors.dark.surfaceElevated },
  preview: { height: 240 },
});
