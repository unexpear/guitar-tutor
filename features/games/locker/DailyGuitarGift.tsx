import React, {useEffect,useState} from 'react';
import {Text,View,StyleSheet} from 'react-native';
import PressableScale from '../../../components/PressableScale';
import {useGuitarRewardStore,useRewardStorageStatus} from '../../store/guitarRewardStore';
import {REWARD_ODDS} from '../../progression/guitarRewards';
import {toDateKey} from '../../practice/streak';
import {dailyGiftStatus} from './dailyGiftStatus';
import { Colors } from '../../../constants/Colors';
import Guitar3D from '../../tuner/components/Guitar3D';
import RewardStorageNotice from './RewardStorageNotice';

export default function DailyGuitarGift({onViewInventory}:{onViewInventory?:()=>void}){
  const state=useGuitarRewardStore();
  const {loadError,saveError,saving}=useRewardStorageStatus();
  const [hydrated,setHydrated]=useState(useGuitarRewardStore.persist.hasHydrated());
  useEffect(()=>{const stop=useGuitarRewardStore.persist.onFinishHydration(()=>setHydrated(true));setHydrated(useGuitarRewardStore.persist.hasHydrated());return stop;},[]);
  const [,refreshDay]=useState(0);
  useEffect(()=>{const timer=setInterval(()=>refreshDay(n=>n+1),60000);return()=>clearInterval(timer);},[]);
  const today=toDateKey(new Date());
  const {claimed,futureDate,streak,claimsUntilRare}=dailyGiftStatus(state.lastClaim,state.streak,today);
  const [showRules,setShowRules]=useState(false);
  const latest=state.collection.at(-1);
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Daily Gift</Text>
    <RewardStorageNotice />
    <Text style={styles.copy}>{loadError?'Restore access to your collection before opening another gift.':!hydrated?'Checking your saved collection…':futureDate?'Your last claim is dated ahead of today. Check your device date; your guitars are safe.':claimed?'You opened today’s gift. Come back tomorrow.':'One free guitar is ready to collect today.'}</Text>
    <PressableScale disabled={!hydrated||claimed||!!loadError} onPress={()=>state.claim()} style={[styles.button,!claimed&&hydrated&&!loadError&&styles.claim]} accessibilityRole="button" accessibilityState={{disabled:!hydrated||claimed||!!loadError}}>
      <Text style={[styles.title,!claimed&&hydrated&&!loadError&&styles.claimText]}>{loadError?'Collection unavailable':!hydrated?'Loading collection…':claimed?'Today’s gift opened':'Open free gift'}</Text>
    </PressableScale>
    {hydrated&&!loadError&&<Text style={styles.copy}>{streak} day check-in streak · {state.collection.length} {state.collection.length===1?'guitar':'guitars'} collected</Text>}
    {hydrated&&!loadError&&!futureDate&&<Text style={styles.copy}>{claimsUntilRare===1?`${claimed?'Your next gift':'Today’s gift'} is guaranteed Rare or better.`:`Rare or better guaranteed in ${claimsUntilRare} more consecutive daily claims.`}</Text>}
    {claimed && latest && <>
      <Text accessibilityLiveRegion="polite" style={styles.title}>{latest.design.name} · {latest.design.rarity==='Starter'?'Common':latest.design.rarity}</Text>
      <View style={styles.preview}><Guitar3D modelId={latest.modelId} design={latest.design} /></View>
      {!saveError&&!saving&&<Text style={styles.copy}>Saved to Owned. It is yours to keep.</Text>}
      <PressableScale accessibilityRole="button" onPress={()=>state.equip(latest.id)} style={styles.button}><Text style={styles.title}>{state.equippedId===latest.id?'Equipped':'Equip this guitar'}</Text></PressableScale>
    </>}
    {onViewInventory&&<PressableScale accessibilityRole="button" onPress={onViewInventory} style={styles.button}><Text style={styles.title}>View my owned guitars ›</Text></PressableScale>}
    <Text style={styles.copy}>Always free. No ads or purchases.</Text>
    <PressableScale onPress={()=>setShowRules(!showRules)} style={styles.button} accessibilityState={{expanded:showRules}}><Text style={styles.title}>Odds & check-in rules {showRules?'−':'+'}</Text></PressableScale>
    {showRules&&<Text style={styles.copy}>{REWARD_ODDS}. Every 7th consecutive check-in guarantees Rare or better. No paid rerolls. Missing a day never removes collected guitars. Check-ins are separate from practice streaks.</Text>}
  </View>;
}
const styles=StyleSheet.create({card:{width:'100%',padding:16,borderRadius:16,backgroundColor:Colors.dark.card,gap:12},title:{color:Colors.dark.text,fontSize:16,fontWeight:'700'},copy:{color:Colors.dark.muted,fontSize:14,lineHeight:21},button:{padding:12,minHeight:48,borderRadius:12,backgroundColor:Colors.dark.surfaceElevated,justifyContent:'center'},claim:{backgroundColor:Colors.success},claimText:{color:'#071408'},preview:{height:240}});
