import { create } from 'zustand';
import { persist,createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { claimReward,emptyRewards,type RewardData } from '../progression/guitarRewards';

interface RewardStore extends RewardData { claim:()=>void; equip:(id:string|null)=>void; reset:()=>void; }
export const useGuitarRewardStore=create<RewardStore>()(persist((set,get)=>({
  ...emptyRewards(),
  claim:()=>{if(useGuitarRewardStore.persist.hasHydrated())set(claimReward(get(),new Date()));},
  equip:(id)=>{if(id===null||get().collection.some(item=>item.id===id))set({equippedId:id});},
  reset:()=>set(emptyRewards()),
}),{name:'standardtune-guitar-rewards',storage:createJSONStorage(()=>AsyncStorage)}));
