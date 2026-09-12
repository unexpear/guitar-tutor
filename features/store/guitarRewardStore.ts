import { create } from 'zustand';
import { persist,createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { claimReward,emptyRewards,type RewardData } from '../progression/guitarRewards';

interface RewardStore extends RewardData { claim:()=>void; equip:(id:string|null)=>void; reset:()=>void; }
export const useRewardStorageStatus = create<{loadError:boolean;saveError:boolean;saving:boolean}>(()=>({loadError:false,saveError:false,saving:false}));
let writes = Promise.resolve();
let revision = 0;
const rewardStorage = {
  getItem: async (key:string) => {
    useRewardStorageStatus.setState({loadError:false});
    try { return await AsyncStorage.getItem(key); }
    catch(error) { useRewardStorageStatus.setState({loadError:true}); throw error; }
  },
  setItem: (key:string,value:string) => {
    const current = ++revision;
    useRewardStorageStatus.setState({saving:true});
    writes = writes.then(async()=>{
      try { await AsyncStorage.setItem(key,value); if(current===revision)useRewardStorageStatus.setState({saveError:false,saving:false}); }
      catch { if(current===revision)useRewardStorageStatus.setState({saveError:true,saving:false}); }
    });
    return writes;
  },
  removeItem: (key:string)=>AsyncStorage.removeItem(key),
};
export const useGuitarRewardStore=create<RewardStore>()(persist((set,get)=>({
  ...emptyRewards(),
  claim:()=>{if(useGuitarRewardStore.persist.hasHydrated())set(claimReward(get(),new Date()));},
  equip:(id)=>{if(useGuitarRewardStore.persist.hasHydrated()&&(id===null||get().collection.some(item=>item.id===id)))set({equippedId:id});},
  reset:()=>set(emptyRewards()),
}),{name:'standardtune-guitar-rewards',storage:createJSONStorage(()=>rewardStorage),onRehydrateStorage:()=> (_state,error)=>{useRewardStorageStatus.setState({loadError:!!error});}}));
