import React, {useRef,useState} from 'react';
import DailyGuitarGift from './DailyGuitarGift';
import GuitarInventory from './GuitarInventory';
import { useGuitarRewardStore } from '../../store/guitarRewardStore';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CARD_SHADOW } from '../../../constants/Colors';
import PressableScale from '../../../components/PressableScale';
import FullGuitarSvg from './FullGuitarSvg';
import { GUITAR_DESIGNS, isDesignUnlocked } from '../../progression/guitarDesigns';
import { levelFromXp, XP_PER_LEVEL } from '../../progression/playerProgress';
import { useProgressStore } from '../../store/progressStore';
import { GUITAR_MODELS, isImportedGuitar, DEFAULT_GUITAR_MODEL_IDS } from '../../progression/guitarModels';

const RARITY_COLOR = {
  Starter: Colors.success,
  Rare: '#64B5F6',
  Epic: '#C084FC',
  Legendary: '#FFD166',
};

export default function GuitarLocker({ onExit }: { onExit: () => void }) {
  const [section,setSection]=useState<'owned'|'box'|'unlocks'>('owned');
  const scroll=useRef<ScrollView>(null);
  const {width,fontScale}=useWindowDimensions();
  const changeSection=(next:typeof section)=>{setSection(next);scroll.current?.scrollTo({y:0,animated:false});};
  const totalXp = useProgressStore((state) => state.totalXp);
  const equippedGift = useGuitarRewardStore(state => state.equippedId);
  const giftCount = useGuitarRewardStore(state => state.collection.length);
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
        <View style={{ flex: 1 }}><Text style={styles.title}>My Guitars</Text><Text style={styles.subtitle}>{GUITAR_MODELS.length} free bodies · {unlocked}/40 finishes · {giftCount} gifts</Text></View>
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {([['owned','Owned'],['box','Free box'],['unlocks','Unlocks']] as const).map(([id,label])=><PressableScale key={id} accessibilityRole="tab" accessibilityState={{selected:section===id}} onPress={()=>changeSection(id)} style={[styles.tab,section===id&&styles.tabActive]}><Text style={styles.sectionTitle}>{label}</Text></PressableScale>)}
      </View>
      <ScrollView ref={scroll} contentContainerStyle={styles.grid}>
        {section==='box' ? <DailyGuitarGift onViewInventory={()=>changeSection('owned')} /> : <>
        {section==='owned' && <>
        <PressableScale accessibilityRole="button" onPress={()=>changeSection('box')} style={styles.boxLink}><Text style={styles.sectionTitle}>Open your free daily guitar box ›</Text><Text style={styles.sectionHelp}>No ads or purchases. Every guitar goes into this collection.</Text></PressableScale>
        <GuitarInventory />
        <Text style={styles.help}>Your first 10 finishes are free. Earn XP by finishing games and lessons; every new level unlocks another design. Cosmetics never lock learning.</Text>
        <Text style={styles.sectionTitle}>Guitar models</Text>
        <Text style={styles.sectionHelp}>Pick one acoustic and one electric shape. Every model is free.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelRow}>
          {GUITAR_MODELS.map((model) => {
            const active = !equippedGift && selectedModels[model.guitarType] === model.id;
            const design = GUITAR_DESIGNS.find((item) => item.guitarType === model.guitarType)!;
            return (
              <PressableScale
                key={model.id}
                onPress={() => { if(selectModel(model.id))useGuitarRewardStore.getState().equip(null); }}
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
        </>}
        <Text style={styles.sectionTitle}>{section==='owned'?'Your unlocked finishes':`Level ${level} · Upcoming unlocks`}</Text>
        {section==='unlocks' && <Text style={styles.help}>Complete lessons and games to earn XP. Finishes unlock automatically as you level up, then appear in Owned. Free boxes use a separate daily check-in streak. {unlocked===40?'You have unlocked every level finish!':''}</Text>}
        <Text style={styles.sectionHelp}>Choosing a finish on Classical or Cotton Candy switches to a customizable guitar body.</Text>
        <View style={styles.cards}>
          {GUITAR_DESIGNS.filter(design=>isDesignUnlocked(design,level)===(section==='owned')).map((design) => {
            const open = isDesignUnlocked(design, level);
            const active = !equippedGift && !isImportedGuitar(selectedModels[design.guitarType]) && selected === design.id;
            return (
              <PressableScale
                key={design.id}
                onPress={() => { if(open && select(design.id))useGuitarRewardStore.getState().equip(null); }}
                disabled={!open}
                style={[styles.card, (width<380||fontScale>1.2)&&{width:'100%'}, active && styles.cardActive, CARD_SHADOW]}
                accessibilityRole="button"
                accessibilityLabel={`${design.name} ${design.guitarType} guitar, ${open ? active ? 'selected' : 'unlocked' : `unlocks at level ${design.unlockLevel}`}`}
              >
                <View style={styles.preview}>
                  <FullGuitarSvg design={design} modelId={isImportedGuitar(selectedModels[design.guitarType]) ? DEFAULT_GUITAR_MODEL_IDS[design.guitarType] : selectedModels[design.guitarType]} width={88} height={148} />
                  {!open && <View style={styles.lock}><Ionicons name="lock-closed" size={22} color="#fff" /></View>}
                </View>
                <Text style={styles.name}>{design.name}</Text>
                <Text style={[styles.rarity, { color: RARITY_COLOR[design.rarity] }]}>{design.rarity} · {design.guitarType === 'acoustic' ? 'Acoustic' : 'Electric'}</Text>
                <Text style={styles.requirement}>{open ? active ? 'EQUIPPED' : 'Tap to equip' : `LEVEL ${design.unlockLevel} · ${Math.max(0,(design.unlockLevel-1)*XP_PER_LEVEL-totalXp)} XP to go`}</Text>
              </PressableScale>
            );
          })}
        </View>
        </>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingHorizontal:18,paddingBottom:8},
  tab:{minHeight:48,padding:10,borderRadius:12,backgroundColor:Colors.dark.surfaceElevated},
  tabActive:{borderColor:Colors.success,borderWidth:2},
  boxLink:{padding:14,borderRadius:16,backgroundColor:Colors.dark.surfaceElevated,marginBottom:12},
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
