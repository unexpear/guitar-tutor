// Cosmetic limits, not gameplay advantages. Keep all existing rewards and odds.
export const rarityLimits=Object.freeze([
  {clearcoat:0,coatRoughness:.4,figureStrength:0,wood:[0],bodies:[0,4]},
  {clearcoat:.35,coatRoughness:.3,figureStrength:.4,wood:[0,3,4],bodies:[0,1,4]},
  {clearcoat:.7,coatRoughness:.2,figureStrength:.7,wood:[0,1,2,3,4],bodies:[0,1,2,3,4]},
  {clearcoat:1,coatRoughness:.12,figureStrength:1,wood:[0,1,2,3,4,5],bodies:[0,1,2,3,4,5]},
].map(policy=>Object.freeze({...policy,wood:Object.freeze(policy.wood),bodies:Object.freeze(policy.bodies)})));
export function mobileRecipe(d) {
  const tier=Math.max(0,['Starter','Rare','Epic','Legendary'].indexOf(d.rarity));
  const seed=d.seed??d.id.split('').reduce((n,c)=>n+c.charCodeAt(0),0);
  const policy=rarityLimits[tier];
  const choice=policy.wood[Math.floor(seed/7)%policy.wood.length];
  const finishPool=tier===0?['Matte','Solid Matte','Rough Paint','Open Pore Wood']:tier===1?['Gloss','Solid Satin','Open Pore Wood','Solid Satin']:['Gloss','Solid Gloss','Gloss','Solid Gloss'];
  const finish=finishPool[Math.floor(seed/31)%finishPool.length];
  const solid=finish.startsWith('Solid ')||finish==='Rough Paint';
  return {primary:d.faceMid,accent:d.faceBottom??'#251710',
    primaryFinish:finish,accentFinish:solid?finish:'Gloss',
    pattern:tier===0||solid?'None':'Edge Burst',patternScale:100,
    textureStrength:65,figureStrength:policy.figureStrength,clearcoatLimit:policy.clearcoat,
    coatRoughness:policy.coatRoughness,seed,collectionStyle:choice,
    bodyStyle:policy.bodies[Math.floor(seed/17)%policy.bodies.length],qualityTier:tier};
}
