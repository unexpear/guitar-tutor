import test from 'node:test';
import assert from 'node:assert/strict';
import { releasePlan, confirmPublished } from '../scripts/release-plan.mjs';
const app = {expo:{version:'1.3.0',android:{versionCode:10}}};
const pkg = {version:'1.3.0'};
const lock = {version:'1.3.0',packages:{'':{version:'1.3.0'}}};
const plan = (args=[], notes='Owner testing') => releasePlan(args,app,pkg,lock,notes);
test('release synchronizes manifests without mutating inputs',()=>{
  const result=plan(['1.4.0']);assert.equal(result.tag,'v1.4.0-11');
  for(const version of [result.app.expo.version,result.pkg.version,result.lock.version,result.lock.packages[''].version])assert.equal(version,'1.4.0');
  assert.equal(app.expo.android.versionCode,10);assert.equal(pkg.version,'1.3.0');
});
test('default release preserves version and dry-run is explicit',()=>{
  assert.equal(plan().tag,'v1.3.0-11');assert.equal(plan(['--dry-run']).dryRun,true);
});
test('release rejects typos, multiple versions and invalid notes',()=>{
  for(const args of [['--dryrun'],['garbage'],['1.4.0','1.5.0']])assert.throws(()=>plan(args));
  for(const notes of ['', ' ', 'x'.repeat(501)])assert.throws(()=>plan([],notes));
});
test('release rejects invalid Android codes',()=>{
  for(const versionCode of [0,-1,1.5,2100000000,'10'])assert.throws(()=>releasePlan([],{expo:{...app.expo,android:{versionCode}}},pkg,lock,'Notes'));
});
test('green workflow with skipped signing or upload is not confirmed',()=>{
  const run={status:'completed',conclusion:'success',jobs:[{steps:[{name:'Build release AAB (Play Store)',conclusion:'success'},{name:'Upload to Play closed testing track',conclusion:'success'}]}]};
  assert.doesNotThrow(()=>confirmPublished(run));
  for(const step of run.jobs[0].steps){step.conclusion='skipped';assert.throws(()=>confirmPublished(run));step.conclusion='success';}
  assert.throws(()=>confirmPublished({...run,conclusion:'failure'}));
});
