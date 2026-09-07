import React, {useEffect,useState} from 'react';
import {Text,View,StyleSheet} from 'react-native';
import PressableScale from '../../../components/PressableScale';
import {useGuitarRewardStore} from '../../store/guitarRewardStore';
import {REWARD_ODDS} from '../../progression/guitarRewards';
import {toDateKey} from '../../practice/streak';
import Guitar3D from '../../tuner/components/Guitar3D';

export default function DailyGuitarGift(){
  const state=useGuitarRewardStore();
  const [hydrated,setHydrated]=useState(useGuitarRewardStore.persist.hasHydrated());
  useEffect(()=>{const stop=useGuitarRewardStore.persist.onFinishHydration(()=>setHydrated(true));setHydrated(useGuitarRewardStore.persist.hasHydrated());return stop;},[]);
  const [,refreshDay]=useState(0);
  useEffect(()=>{const timer=setInterval(()=>refreshDay(n=>n+1),60000);return()=>clearInterval(timer);},[]);
  const [previewId,setPreviewId]=useState<string|null>(null);
  const preview=state.collection.find(g=>g.id===previewId)??state.collection.at(-1);
  const claimed=!!state.lastClaim&&state.lastClaim>=toDateKey(new Date());
  return <View style={styles.card}>
    <Text style={styles.title}>Daily guitar gift</Text>
    <Text style={styles.copy}>One free surprise each day. No ads, purchases or paid rerolls. Keep every guitar. Your check-in streak is separate from practice.</Text>
    <Text style={styles.copy}>{REWARD_ODDS}. Every 7th consecutive check-in guarantees Rare or better. Missing a day never removes your guitars.</Text>
    <PressableScale disabled={!hydrated||claimed} onPress={()=>{state.claim();setPreviewId(null);}} style={styles.button} accessibilityRole="button">
      <Text style={styles.title}>{!hydrated?'Loading collection…':claimed?'Today’s gift opened':'Open free guitar gift'}</Text>
    </PressableScale>
    <Text style={styles.copy}>{state.streak} day check-in streak · {state.collection.length} gifts collected</Text>
    {preview&&<>
      <View style={styles.preview}><Guitar3D design={preview.design} modelId={preview.modelId}/></View>
      <Text style={styles.title}>{preview.design.name} · {preview.design.rarity==='Starter'?'Standard':preview.design.rarity}</Text>
      <PressableScale style={styles.button} onPress={()=>state.equip(preview.id)}><Text style={styles.title}>{state.equippedId===preview.id?'Equipped in tuner':'Equip in tuner'}</Text></PressableScale>
    </>}
    {state.equippedId&&<PressableScale style={styles.button} onPress={()=>state.equip(null)}><Text style={styles.copy}>Use my normal model and finish</Text></PressableScale>}
    {state.collection.map(g=><PressableScale key={g.id} style={styles.item} onPress={()=>setPreviewId(g.id)}><Text style={styles.copy}>{g.design.name} · {g.date}{g.id===state.equippedId?' · Equipped':''}</Text></PressableScale>)}
  </View>;
}
const styles=StyleSheet.create({card:{width:'100%',padding:14,borderRadius:16,backgroundColor:'#202035',gap:10},title:{color:'#f1f1f5',fontSize:15,fontWeight:'700'},copy:{color:'#bbbbcc',fontSize:12,lineHeight:18},button:{padding:12,minHeight:48,borderRadius:12,backgroundColor:'#303049'},preview:{height:240},item:{paddingVertical:10,minHeight:44}});
