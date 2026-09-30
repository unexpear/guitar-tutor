import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DailyGuitarGift from './DailyGuitarGift';
import GuitarInventory from './GuitarInventory';
import GuitarDetail, { type GuitarDetailItem } from './GuitarDetail';
import { useGuitarRewardStore } from '../../store/guitarRewardStore';
import { Colors } from '../../../constants/Colors';
import { Layout, Type, collectionColumns } from '../../../constants/Layout';
import PressableScale from '../../../components/PressableScale';
import SearchField from '../../../components/SearchField';
import ChoiceChips from '../../../components/ChoiceChips';
import GuitarThumbnail, { GuitarThumbnailProvider } from './GuitarThumbnail';
import { GUITAR_DESIGNS, guitarDesign, isDesignUnlocked } from '../../progression/guitarDesigns';
import { levelFromXp, XP_PER_LEVEL } from '../../progression/playerProgress';
import { useProgressStore } from '../../store/progressStore';
import { GUITAR_MODELS, guitarModel, isImportedGuitar, DEFAULT_GUITAR_MODEL_IDS } from '../../progression/guitarModels';

const RARITY_COLOR = { Starter: Colors.success, Rare: '#64B5F6', Epic: '#C084FC', Legendary: '#FFD166' };

export default function GuitarLocker({ onExit }: { onExit: () => void }) {
  return <GuitarThumbnailProvider><LockerContent onExit={onExit} /></GuitarThumbnailProvider>;
}

function LockerContent({ onExit }: { onExit: () => void }) {
  const [section, setSection] = useState<'owned' | 'box' | 'unlocks'>('owned');
  const [category, setCategory] = useState<'gifts' | 'bodies' | 'finishes'>('gifts');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'acoustic' | 'electric'>('all');
  const [sort, setSort] = useState<'default' | 'name' | 'rarity'>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<GuitarDetailItem | null>(null);
  const scroll = useRef<ScrollView>(null);
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [contentWidth, setContentWidth] = useState(Math.min(width, Layout.contentWidth));
  const columns = collectionColumns(contentWidth, fontScale);
  const cardWidth = (contentWidth - Layout.page * 2 - Layout.gap * (columns - 1)) / columns;
  const changeSection = (next: typeof section) => { setSection(next); setQuery(''); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const totalXp = useProgressStore(s => s.totalXp);
  const equippedGift = useGuitarRewardStore(s => s.collection.find(g => g.id === s.equippedId));
  const giftCount = useGuitarRewardStore(s => s.collection.length);
  const selected = useProgressStore(s => s.selectedGuitarDesignId);
  const select = useProgressStore(s => s.selectGuitarDesign);
  const selectedModels = useProgressStore(s => s.selectedGuitarModelIds);
  const selectModel = useProgressStore(s => s.selectGuitarModel);
  const level = levelFromXp(totalXp);
  const unlocked = GUITAR_DESIGNS.filter(design => isDesignUnlocked(design, level)).length;
  const matches = (name: string, guitarType: string, rarity = '') =>
    (type === 'all' || type === guitarType) && `${name} ${guitarType} ${rarity}`.toLowerCase().includes(query.trim().toLowerCase());
  const finishes = GUITAR_DESIGNS.filter(design => isDesignUnlocked(design, level) === (section === 'owned') && matches(design.name, design.guitarType, design.rarity))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'rarity' ? b.unlockLevel - a.unlockLevel : a.unlockLevel - b.unlockLevel);
  const bodies = GUITAR_MODELS.filter(model => matches(model.name, model.guitarType)).slice().sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : 0);

  return <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
    <View style={styles.header}>
      <PressableScale onPress={onExit} style={styles.close} accessibilityLabel="Back from My Guitars"><Text style={styles.title}>←</Text></PressableScale>
      <View style={{ flex: 1 }}><Text style={styles.title}>My Guitars</Text><Text style={styles.subtitle}>{giftCount} collected · {unlocked}/{GUITAR_DESIGNS.length} finishes</Text></View>
    </View>
    <View style={styles.tabs} accessibilityRole="tablist">
      {([['owned', 'Owned'], ['box', 'Daily Gift'], ['unlocks', 'Unlocks']] as const).map(([id, label]) => <PressableScale key={id} accessibilityRole="tab" accessibilityState={{ selected: section === id }} onPress={() => changeSection(id)} style={[styles.tab, section === id && styles.tabActive]}><Text style={styles.tabText}>{label}</Text></PressableScale>)}
    </View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} onLayout={event => setContentWidth(Math.min(event.nativeEvent.layout.width, Layout.contentWidth))}>
      {section === 'box' ? <DailyGuitarGift onViewInventory={() => { setCategory('gifts'); changeSection('owned'); }} /> : <>
        {section === 'owned' && <>
          <View style={styles.summary}>
            <Text style={styles.sectionTitle}>Equipped</Text>
            <Text style={styles.copy}>{equippedGift ? `${equippedGift.design.name} · ${guitarModel(equippedGift.modelId)?.name}` : `${guitarModel(selectedModels.acoustic)?.name} / ${guitarModel(selectedModels.electric)?.name}`}</Text>
            <Text style={styles.caption}>{equippedGift ? 'Appears in the tuner for its matching instrument.' : `Finish: ${guitarDesign(selected).name}. Preview-only bodies keep their original finish until they pass phone testing.`}</Text>
          </View>
          <ChoiceChips label="Owned category" value={category} options={[{ value: 'gifts', label: `Collected (${giftCount})` }, { value: 'bodies', label: `Bodies (${GUITAR_MODELS.length})` }, { value: 'finishes', label: `Finishes (${unlocked})` }]} onChange={next => { setCategory(next); setQuery(''); if (next === 'bodies' && sort === 'rarity') setSort('default'); }} />
        </>}
        {section === 'unlocks' && <><Text style={styles.sectionTitle}>Level {level} · Upcoming finishes</Text><Text style={styles.copy}>Earn XP in lessons and games. Every body is free; only finishes unlock by level.</Text></>}
        <SearchField value={query} onChangeText={setQuery} placeholder="Search guitars" />
        <PressableScale onPress={() => setShowFilters(!showFilters)} style={styles.filterToggle} accessibilityState={{ expanded: showFilters }}><Text style={styles.caption}>Filter & sort · {type === 'all' ? 'All types' : type} · {sort === 'default' ? 'Default order' : sort} {showFilters ? '−' : '+'}</Text></PressableScale>
        {showFilters && <>
        <Text style={styles.caption}>Filter by instrument</Text>
        <ChoiceChips label="Guitar type" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, { value: 'acoustic', label: 'Acoustic' }, { value: 'electric', label: 'Electric' }]} />
        <Text style={styles.caption}>Sort</Text>
        <ChoiceChips label="Sort guitars" value={sort} onChange={setSort} options={[{ value: 'default', label: category === 'gifts' && section === 'owned' ? 'Newest' : category === 'bodies' && section === 'owned' ? 'Catalog' : 'Level' }, { value: 'name', label: 'Name' }, ...(category === 'bodies' && section === 'owned' ? [] : [{ value: 'rarity' as const, label: 'Rarity' }])]} />
        </>}
        {section === 'owned' && category === 'gifts' ? <GuitarInventory query={query} type={type} sort={sort} cardWidth={cardWidth} onDailyGift={() => changeSection('box')} /> : <>
          {section === 'owned' && category === 'bodies' ? <>
            <Text style={styles.copy}>Choose one body per instrument. All {GUITAR_MODELS.length} are free.</Text>
            <View style={styles.cards}>{bodies.map(model => {
              const active = !equippedGift && selectedModels[model.guitarType] === model.id;
              const design = { ...guitarDesign(selected), guitarType: model.guitarType };
              return <PressableScale key={model.id} style={[styles.card, { width: cardWidth }, active && styles.active]}
                accessibilityLabel={`${model.name}, ${model.guitarType}, ${active ? 'equipped' : 'free'}. Preview guitar.`}
                onPress={() => setDetail({ name: model.name, description: model.description, design, modelId: model.id, action: active ? 'Keep equipped' : 'Equip body', onEquip: () => { if (selectModel(model.id)) useGuitarRewardStore.getState().equip(null); } })}>
                <GuitarThumbnail design={design} modelId={model.id} />
                <Text style={styles.name}>{model.name}</Text><Text style={styles.caption}>{model.guitarType} · Free</Text><Text style={styles.status}>{active ? '✓ Equipped' : 'Preview & equip'}</Text>
              </PressableScale>;
            })}</View>
            {!bodies.length && <Text style={styles.copy}>No bodies match. Try another search or type.</Text>}
          </> : <>
            {section === 'owned' && <Text style={styles.caption}>Preview a finish before equipping. Preview-only bodies switch to a customizable catalog body first.</Text>}
            <View style={styles.cards}>{finishes.map(design => {
              const open = isDesignUnlocked(design, level);
              const modelId = isImportedGuitar(selectedModels[design.guitarType]) ? DEFAULT_GUITAR_MODEL_IDS[design.guitarType] : selectedModels[design.guitarType];
              const active = !equippedGift && !isImportedGuitar(selectedModels[design.guitarType]) && selected === design.id;
              const requirement = `Level ${design.unlockLevel} · ${Math.max(0, (design.unlockLevel - 1) * XP_PER_LEVEL - totalXp)} XP to go`;
              return <PressableScale key={design.id} style={[styles.card, { width: cardWidth }, active && styles.active]}
                accessibilityLabel={`${design.name}, ${design.rarity}, ${open ? active ? 'equipped' : 'owned' : requirement}. Preview finish.`}
                onPress={() => setDetail({ name: design.name, design, modelId, description: `${design.rarity} · ${design.guitarType}. ${open ? 'Owned finish.' : requirement}`, action: open ? active ? 'Keep equipped' : 'Equip finish' : requirement, onEquip: open ? () => { if (select(design.id)) useGuitarRewardStore.getState().equip(null); } : undefined })}>
                <GuitarThumbnail design={design} modelId={modelId} />
                <Text style={styles.name}>{design.name}</Text>
                <Text style={[styles.caption, { color: RARITY_COLOR[design.rarity] }]}>{design.rarity} · {design.guitarType}</Text>
                <Text style={styles.status}>{open ? active ? '✓ Equipped' : 'Preview & equip' : requirement}</Text>
              </PressableScale>;
            })}</View>
            {!finishes.length && <Text style={styles.copy}>{section === 'unlocks' && unlocked === GUITAR_DESIGNS.length ? 'Every finish unlocked. Find them in Owned.' : 'No finishes match. Try another search or type.'}</Text>}
          </>}
        </>}
      </>}
    </ScrollView>
    <GuitarDetail item={detail} onClose={() => setDetail(null)} />
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingHorizontal: Layout.page, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  close: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.surfaceElevated },
  title: { ...Type.title, color: Colors.dark.text },
  subtitle: { ...Type.caption, color: Colors.dark.muted, marginTop: 4 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Layout.page, paddingBottom: 8 },
  tab: { minHeight: 48, justifyContent: 'center', padding: 10, borderRadius: 12, borderWidth: 2, borderColor: Colors.dark.cardBorder, backgroundColor: Colors.dark.surfaceElevated },
  tabActive: { borderColor: Colors.success },
  tabText: { fontSize: 15, fontWeight: '700', color: Colors.dark.text },
  content: { width: '100%', maxWidth: Layout.contentWidth, alignSelf: 'center', padding: Layout.page, gap: Layout.gap },
  summary: { padding: 16, borderRadius: Layout.radius, backgroundColor: Colors.dark.card, gap: 6 },
  filterToggle: { minHeight: 48, justifyContent: 'center', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.dark.cardBorder },
  sectionTitle: { ...Type.heading, color: Colors.dark.text },
  copy: { ...Type.body, color: Colors.dark.muted },
  caption: { ...Type.caption, color: Colors.dark.muted },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.gap },
  card: { borderRadius: Layout.radius, backgroundColor: Colors.dark.card, borderWidth: 2, borderColor: Colors.dark.cardBorder, padding: 12, gap: 6 },
  active: { borderColor: Colors.success },
  preview: { height: 154, alignItems: 'center', justifyContent: 'center' },
  name: { color: Colors.dark.text, fontSize: 16, fontWeight: '700' },
  status: { ...Type.caption, color: Colors.dark.text, fontWeight: '600' },
});
