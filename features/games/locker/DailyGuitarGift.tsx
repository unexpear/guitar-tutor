import React, {useEffect,useState} from 'react';
import {Text,View,StyleSheet} from 'react-native';
import PressableScale from '../../../components/PressableScale';
import {useGuitarRewardStore,useRewardStorageStatus} from '../../store/guitarRewardStore';
import {REWARD_ODDS} from '../../progression/guitarRewards';
import {toDateKey} from '../../practice/streak';
import Guitar3D from '../../tuner/components/Guitar3D';
import RewardStorageNotice from './RewardStorageNotice';

export default function DailyGuitarGift({onViewInventory}:{onViewInventory?:()=>void}){
  const state=useGuitarRewardStore();
  const {loadError,saveError,saving}=useRewardStorageStatus();
  const [hydrated,setHydrated]=useState(useGuitarRewardStore.persist.hasHydrated());
  useEffect(()=>{const stop=useGuitarRewardStore.persist.onFinishHydration(()=>setHydrated(true));setHydrated(useGuitarRewardStore.persist.hasHydrated());return stop;},[]);
  const [,refreshDay]=useState(0);
  useEffect(()=>{const timer=setInterval(()=>refreshDay(n=>n+1),60000);return()=>clearInterval(timer);},[]);
  const claimed=!!state.lastClaim&&state.lastClaim>=toDateKey(new Date());
  const latest=state.collection.at(-1);
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Free daily guitar box</Text>
    <RewardStorageNotice />
    <Text style={styles.copy}>One free surprise each day. No ads, purchases or paid rerolls. Keep every guitar. Your check-in streak is separate from practice.</Text>
    <Text style={styles.copy}>{REWARD_ODDS}. Every 7th consecutive check-in guarantees Rare or better. Missing a day never removes your guitars.</Text>
    <PressableScale disabled={!hydrated||claimed} onPress={()=>state.claim()} style={styles.button} accessibilityRole="button">
      <Text style={styles.title}>{loadError?'Collection unavailable — retry below':!hydrated?'Loading collection…':claimed?'Today’s gift opened':'Open free guitar gift'}</Text>
    </PressableScale>
    <Text style={styles.copy}>{state.streak} day check-in streak · {state.collection.length} gifts collected</Text>
    {claimed && latest && <>
      <Text accessibilityLiveRegion="polite" style={styles.title}>{latest.design.name} · {latest.design.rarity==='Starter'?'Common':latest.design.rarity}</Text>
      <View style={styles.preview}><Guitar3D modelId={latest.modelId} design={latest.design} /></View>
      {!saveError&&!saving&&<Text style={styles.copy}>Saved to Owned. It is yours to keep.</Text>}
      <PressableScale accessibilityRole="button" onPress={()=>state.equip(latest.id)} style={styles.button}><Text style={styles.title}>{state.equippedId===latest.id?'Equipped':'Equip this guitar'}</Text></PressableScale>
    </>}
    {onViewInventory&&<PressableScale accessibilityRole="button" onPress={onViewInventory} style={styles.button}><Text style={styles.title}>View my owned guitars ›</Text></PressableScale>}
  </View>;
}
const styles=StyleSheet.create({card:{width:'100%',padding:14,borderRadius:16,backgroundColor:'#202035',gap:10},title:{color:'#f1f1f5',fontSize:15,fontWeight:'700'},copy:{color:'#bbbbcc',fontSize:12,lineHeight:18},button:{padding:12,minHeight:48,borderRadius:12,backgroundColor:'#303049'},preview:{height:240},item:{paddingVertical:10,minHeight:44}});
