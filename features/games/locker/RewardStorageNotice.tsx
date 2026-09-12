import React from 'react';
import {Text,View} from 'react-native';
import PressableScale from '../../../components/PressableScale';
import {useGuitarRewardStore,useRewardStorageStatus} from '../../store/guitarRewardStore';
export default function RewardStorageNotice(){
  const {loadError,saveError,saving}=useRewardStorageStatus();
  if(!loadError&&!saveError&&!saving)return null;
  return <View accessibilityLiveRegion="polite" style={{padding:12,gap:8}}>
    <Text style={{color:'#FFD166'}}>{loadError?'Could not load your saved guitars. Retry before making changes.':saveError?'Your latest changes are not saved. Keep the app open and retry saving.': 'Saving guitar collection…'}</Text>
    {(loadError||saveError)&&<PressableScale accessibilityRole="button" style={{padding:12,minHeight:48}} onPress={()=>{if(loadError)void useGuitarRewardStore.persist.rehydrate();else useGuitarRewardStore.setState({});}}><Text style={{color:'#fff'}}>Retry {loadError?'loading':'saving'}</Text></PressableScale>}
  </View>;
}
