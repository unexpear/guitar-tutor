import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from '../../../components/PressableScale';
import { Colors } from '../../../constants/Colors';
import { Layout, Type } from '../../../constants/Layout';
import { guitarModel } from '../../progression/guitarModels';
import { useGuitarRewardStore } from '../../store/guitarRewardStore';
import GuitarDetail, { type GuitarDetailItem } from './GuitarDetail';
import GuitarThumbnail from './GuitarThumbnail';
import RewardStorageNotice from './RewardStorageNotice';

const rarityRank = { Starter: 0, Rare: 1, Epic: 2, Legendary: 3 };
/** Saved rewards remain distinct from free bodies and level finishes. */
export default function GuitarInventory({ query = '', type = 'all', sort = 'default', cardWidth, onDailyGift }: {
  query?: string; type?: 'all' | 'acoustic' | 'electric'; sort?: 'default' | 'name' | 'rarity'; cardWidth?: number; onDailyGift?: () => void;
}) {
  const collection = useGuitarRewardStore(s => s.collection);
  const equippedId = useGuitarRewardStore(s => s.equippedId);
  const equip = useGuitarRewardStore(s => s.equip);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<GuitarDetailItem | null>(null);
  useEffect(() => setPage(0), [query, type, sort, collection.length]);
  const filtered = collection.slice().reverse().filter(guitar =>
    (type === 'all' || type === guitar.design.guitarType) &&
    `${guitar.design.name} ${guitarModel(guitar.modelId)?.name} ${guitar.design.rarity === 'Starter' ? 'Common' : guitar.design.rarity}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === 'name' ? a.design.name.localeCompare(b.design.name) : sort === 'rarity' ? rarityRank[b.design.rarity] - rarityRank[a.design.rarity] : 0);
  return <View style={styles.inventory}>
    <RewardStorageNotice />
    <Text style={styles.copy}>Collected guitars are yours to keep. Equip one to see it in the tuner for its matching instrument.</Text>
    {collection.length === 0 ? <>
      <Text style={styles.title}>Your collection starts here</Text>
      <Text style={styles.copy}>Open a free Daily Gift. You can also use every free body and your starter finishes now.</Text>
      {onDailyGift && <PressableScale onPress={onDailyGift} style={styles.button}><Text style={styles.title}>Open Daily Gift ›</Text></PressableScale>}
    </> : !filtered.length && <Text style={styles.copy}>No collected guitars match. Try another search or type.</Text>}
    <View style={styles.grid}>{filtered.slice(page * 12, (page + 1) * 12).map(guitar => {
      const active = equippedId === guitar.id;
      const rarity = guitar.design.rarity === 'Starter' ? 'Common' : guitar.design.rarity;
      return <PressableScale key={guitar.id} style={[styles.item, { width: cardWidth ?? '100%' }, active && styles.active]}
        accessibilityLabel={`${guitar.design.name}, ${rarity}${active ? ', equipped' : ''}. Preview and equip guitar.`}
        onPress={() => setDetail({ name: guitar.design.name, design: guitar.design, modelId: guitar.modelId,
          description: `${guitarModel(guitar.modelId)?.name} · ${rarity}. Collected ${guitar.date}.`,
          action: active ? 'Keep equipped' : 'Equip in tuner', onEquip: () => equip(guitar.id) })}>
        <GuitarThumbnail design={guitar.design} modelId={guitar.modelId} />
        <Text style={styles.title}>{guitar.design.name}</Text>
        <Text style={styles.copy}>{guitarModel(guitar.modelId)?.name} · {rarity}</Text>
        <Text style={[styles.copy, active && styles.equipped]}>{active ? '✓ Equipped' : 'Preview & equip'}</Text>
      </PressableScale>;
    })}</View>
    {filtered.length > 12 && <View style={styles.grid}>
      {page > 0 && <PressableScale onPress={() => setPage(value => value - 1)} style={styles.button}><Text style={styles.copy}>← Previous 12</Text></PressableScale>}
      <Text style={styles.copy}>Page {page + 1} of {Math.ceil(filtered.length / 12)}</Text>
      {(page + 1) * 12 < filtered.length && <PressableScale onPress={() => setPage(value => value + 1)} style={styles.button}><Text style={styles.copy}>Next 12 →</Text></PressableScale>}
    </View>}
    {equippedId && <PressableScale onPress={() => equip(null)} style={styles.button}><Text style={styles.copy}>Use my chosen body and finish</Text></PressableScale>}
    <GuitarDetail item={detail} onClose={() => setDetail(null)} />
  </View>;
}
const styles = StyleSheet.create({
  inventory: { width: '100%', gap: Layout.gap },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.gap },
  title: { color: Colors.dark.text, fontWeight: '700', fontSize: 16 },
  copy: { ...Type.caption, color: Colors.dark.muted },
  item: { borderWidth: 2, borderColor: Colors.dark.cardBorder, borderRadius: Layout.radius, padding: 12, gap: 6, backgroundColor: Colors.dark.card },
  active: { borderColor: Colors.success },
  equipped: { color: Colors.success, fontWeight: '800' },
  button: { minHeight: Layout.touch, padding: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: Colors.dark.surfaceElevated },
  preview: { height: 154, alignItems: 'center', justifyContent: 'center' },
});
