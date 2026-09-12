import type { GuitarDesign } from './guitarDesigns';
import { GUITAR_MODELS, isImportedGuitar, type GuitarModelId } from './guitarModels';
const rewardModels=GUITAR_MODELS.filter(model=>!isImportedGuitar(model.id));
import { nextStreak, toDateKey } from '../practice/streak';

export const REWARD_ODDS = 'Common 50% · Rare 30% · Epic 15% · Legendary 5%';
export interface GuitarReward { id:string; date:string; modelId:GuitarModelId; design:GuitarDesign & {seed:number}; }
export interface RewardData { lastClaim:string|null; streak:number; collection:GuitarReward[]; equippedId:string|null; }
export function rewardForInstrument(reward:GuitarReward|undefined, type:string|undefined){return reward?.design.guitarType===type?reward:undefined;}
export const emptyRewards = ():RewardData=>({lastClaim:null,streak:0,collection:[],equippedId:null});
export function claimReward(state:RewardData, now:Date, random:()=>number=Math.random):RewardData {
  if(!Number.isFinite(now.getTime()))return state;
  const date=toDateKey(now);
  // Same-day double taps and a clock moved backwards cannot reroll a reward.
  if(state.lastClaim&&date<=state.lastClaim)return state;
  const streak=nextStreak(state.lastClaim,state.streak,date);
  const roll=Math.max(0,Math.min(.999999,random()));
  let tier=roll<.5?0:roll<.8?1:roll<.95?2:3;
  if(streak%7===0)tier=Math.max(1,tier);
  const seed=Math.floor(Math.max(0,Math.min(.999999,random()))*2147483647);
  // New gifts only: retain a 50/50 acoustic/electric split while making the
  // round twin-horn double-cut less frequent. Saved rewards store their own modelId.
  const slot=seed%20;
  const modelId=slot<5?'acoustic-grand':slot<10?'acoustic-cutaway':slot<12?'electric-doublecut':'electric-singlecut';
  const model=rewardModels.find(candidate=>candidate.id===modelId)!;
  const palettes=[['#9b643b','#e0bc83'],['#376e82','#dbcfaa'],['#704650','#e5be83'],['#334c65','#eac783'],['#654435','#e5c196'],['#53674e','#d8c89c']];
  const [face,rim]=palettes[Math.floor(seed/4)%palettes.length];
  const rarity=(['Starter','Rare','Epic','Legendary'] as const)[tier];
  const id=`daily-${date}-${seed}`;
  const reward:GuitarReward={id,date,modelId:model.id,design:{id,seed,name:`${['Studio','Artisan','Signature','Masterbuilt'][tier]} ${seed.toString(36).toUpperCase()}`,guitarType:model.guitarType,rarity,unlockLevel:1,faceTop:rim,faceMid:face,faceBottom:'#201a18',rim,grain:null,fretboardTop:'#302018',fretboardBottom:'#17110e',nut:'#efe2c6',string:'#cccccc'}};
  return {lastClaim:date,streak,collection:[...state.collection,reward],equippedId:state.equippedId};
}
