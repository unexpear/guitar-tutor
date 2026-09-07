import type { GuitarDesign } from './guitarDesigns';
import { GUITAR_MODELS, isImportedGuitar, type GuitarModelId } from './guitarModels';
const rewardModels=GUITAR_MODELS.filter(model=>!isImportedGuitar(model.id));
import { nextStreak, toDateKey } from '../practice/streak';

export const REWARD_ODDS = 'Standard 60% · Rare 25% · Epic 12% · Legendary 3%';
export interface GuitarReward { id:string; date:string; modelId:GuitarModelId; design:GuitarDesign & {seed:number}; }
export interface RewardData { lastClaim:string|null; streak:number; collection:GuitarReward[]; equippedId:string|null; }
export const emptyRewards = ():RewardData=>({lastClaim:null,streak:0,collection:[],equippedId:null});
export function claimReward(state:RewardData, now:Date, random:()=>number=Math.random):RewardData {
  if(!Number.isFinite(now.getTime()))return state;
  const date=toDateKey(now);
  // Same-day double taps and a clock moved backwards cannot reroll a reward.
  if(state.lastClaim&&date<=state.lastClaim)return state;
  const streak=nextStreak(state.lastClaim,state.streak,date);
  const roll=Math.max(0,Math.min(.999999,random()));
  let tier=roll<.6?0:roll<.85?1:roll<.97?2:3;
  if(streak%7===0)tier=Math.max(1,tier);
  const seed=Math.floor(Math.max(0,Math.min(.999999,random()))*2147483647);
  const model=rewardModels[seed%rewardModels.length];
  const palettes=[['#9b643b','#e0bc83'],['#376e82','#dbcfaa'],['#704650','#e5be83'],['#334c65','#eac783'],['#654435','#e5c196'],['#53674e','#d8c89c']];
  const [face,rim]=palettes[Math.floor(seed/4)%palettes.length];
  const rarity=(['Starter','Rare','Epic','Legendary'] as const)[tier];
  const id=`daily-${date}-${seed}`;
  const reward:GuitarReward={id,date,modelId:model.id,design:{id,seed,name:`${['Studio','Artisan','Signature','Masterbuilt'][tier]} ${seed.toString(36).toUpperCase()}`,guitarType:model.guitarType,rarity,unlockLevel:1,faceTop:rim,faceMid:face,faceBottom:'#201a18',rim,grain:null,fretboardTop:'#302018',fretboardBottom:'#17110e',nut:'#efe2c6',string:'#cccccc'}};
  return {lastClaim:date,streak,collection:[...state.collection,reward],equippedId:state.equippedId};
}
