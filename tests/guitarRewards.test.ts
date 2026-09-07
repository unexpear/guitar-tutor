import {test} from 'node:test';
import assert from 'node:assert/strict';
import {claimReward,emptyRewards} from '../features/progression/guitarRewards';

test('daily gifts cannot reroll on the same day or a backwards clock',()=>{
  const first=claimReward(emptyRewards(),new Date(2026,8,6),()=>.2);
  assert.equal(first.collection.length,1);
  assert.equal(claimReward(first,new Date(2026,8,6,23),()=>.99),first);
  assert.equal(claimReward(first,new Date(2026,8,5),()=>.99),first);
  assert.equal(claimReward(first,new Date(NaN)),first);
});
test('seven consecutive check-ins guarantee rare; gaps retain every reward',()=>{
  let state=emptyRewards();
  for(let day=1;day<=7;day++)state=claimReward(state,new Date(2026,8,day),()=>.1);
  assert.equal(state.streak,7);assert.equal(state.collection[6].design.rarity,'Rare');
  state=claimReward(state,new Date(2026,8,10),()=>.1);
  assert.equal(state.streak,1);assert.equal(state.collection.length,8);
});
test('rarity thresholds match displayed odds and saved recipes reproduce',()=>{
  for(const [roll,rarity] of [[0,'Starter'],[.5999,'Starter'],[.6,'Rare'],[.8499,'Rare'],[.85,'Epic'],[.9699,'Epic'],[.97,'Legendary']] as const){
    const date=new Date(2026,8,6),a=claimReward(emptyRewards(),date,()=>roll);
    assert.equal(a.collection[0].design.rarity,rarity);
    assert.deepEqual(a,claimReward(emptyRewards(),date,()=>roll));
    assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
  }
});
