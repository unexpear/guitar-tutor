import {test} from 'node:test';
import assert from 'node:assert/strict';
import {claimReward,emptyRewards,REWARD_ODDS,rewardForInstrument} from '../features/progression/guitarRewards';

test('new gifts reduce round twin-horn doublecuts without changing existing inventory',()=>{
  const counts:Record<string,number>={};
  for(let seed=0;seed<20;seed++) {
    const old=claimReward(emptyRewards(),new Date(2026,8,6),()=>.2);
    let calls=0;
    const next=claimReward(old,new Date(2026,8,7),()=>++calls===1?.2:(seed+.25)/2147483647);
    assert.equal(next.collection[0],old.collection[0]);
    const id=next.collection[1].modelId;counts[id]=(counts[id]??0)+1;
  }
  assert.deepEqual(counts,{'acoustic-grand':5,'acoustic-cutaway':5,'electric-doublecut':2,'electric-singlecut':8});
});

test('daily gifts cannot reroll on the same day or a backwards clock',()=>{
  const first=claimReward(emptyRewards(),new Date(2026,8,6),()=>.2);
  assert.equal(first.collection.length,1);
  assert.equal(claimReward(first,new Date(2026,8,6,23),()=>.99),first);
  assert.equal(claimReward(first,new Date(2026,8,5),()=>.99),first);
  assert.equal(claimReward(first,new Date(NaN)),first);
});
test('equipped reward only overrides its matching instrument',()=>{
  const gift=claimReward(emptyRewards(),new Date(2026,8,6),()=>.2).collection[0];
  assert.equal(rewardForInstrument(gift,gift.design.guitarType),gift);
  assert.equal(rewardForInstrument(gift,gift.design.guitarType==='acoustic'?'electric':'acoustic'),undefined);
  assert.equal(rewardForInstrument(gift,undefined),undefined);
});
test('seven consecutive check-ins guarantee rare; gaps retain every reward',()=>{
  let state=emptyRewards();
  for(let day=1;day<=7;day++)state=claimReward(state,new Date(2026,8,day),()=>.1);
  assert.equal(state.streak,7);assert.equal(state.collection[6].design.rarity,'Rare');
  state=claimReward(state,new Date(2026,8,10),()=>.1);
  assert.equal(state.streak,1);assert.equal(state.collection.length,8);
});
test('rarity thresholds match displayed odds and saved recipes reproduce',()=>{
  assert.equal(REWARD_ODDS,'Common 50% · Rare 30% · Epic 15% · Legendary 5%');
  for(const [roll,rarity] of [[0,'Starter'],[.4999,'Starter'],[.5,'Rare'],[.7999,'Rare'],[.8,'Epic'],[.9499,'Epic'],[.95,'Legendary'],[.9999,'Legendary']] as const){
    const date=new Date(2026,8,6),a=claimReward(emptyRewards(),date,()=>roll);
    assert.equal(a.collection[0].design.rarity,rarity);
    assert.deepEqual(a,claimReward(emptyRewards(),date,()=>roll));
    assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
  }
});

test('ordinary and seventh-day odds match exact roll intervals',()=>{
  for(const seventhDay of [false,true]){
    const counts:Record<string,number>={Starter:0,Rare:0,Epic:0,Legendary:0};
    for(let i=0;i<1000;i++){
      const state={...emptyRewards(),lastClaim:seventhDay?'2026-09-06':null,streak:seventhDay?6:0};
      const result=claimReward(state,new Date(2026,8,7),()=>(i+.5)/1000);
      counts[result.collection[0].design.rarity]++;
    }
    assert.deepEqual(counts,seventhDay?{Starter:0,Rare:800,Epic:150,Legendary:50}:{Starter:500,Rare:300,Epic:150,Legendary:50});
  }
});
