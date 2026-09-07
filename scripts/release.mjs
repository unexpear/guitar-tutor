#!/usr/bin/env node
// --verify TAG resumes verification without incrementing or pushing again.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { releasePlan, confirmPublished } from './release-plan.mjs';
const cwd = fileURLToPath(new URL('..', import.meta.url));
const command = (name, ...args) => execFileSync(name, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const git = (...args) => command('git', ...args);
const gh = (...args) => command('gh', ...args);
const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function verify(tag) {
  const sha = git('rev-parse', `${tag}^{commit}`);
  console.log(`Waiting for ${tag}; resume with: npm run release -- --verify ${tag}`);
  let run;
  for (let attempt = 0; attempt < 24; attempt++) {
    const runs = JSON.parse(gh('run', 'list', '--workflow', 'build-release.yml', '--branch', tag, '--event', 'push', '--limit', '20', '--json', 'databaseId,headSha,url'));
    run = runs.find(candidate => candidate.headSha === sha);
    if (run) break;
    await pause(5000);
  }
  if (!run) throw Error('Matching CI run not found. Use --verify; do not cut another release.');
  console.log(run.url);
  const deadline = Date.now() + 90 * 60 * 1000;
  let lastStatus;
  while (Date.now() < deadline) {
    const result = JSON.parse(gh('run', 'view', String(run.databaseId), '--json', 'status,conclusion,jobs'));
    const status = result.jobs.map(job => `${job.name}: ${job.status}/${job.conclusion || 'pending'}`).join(' | ');
    if (status !== lastStatus) { console.log(status); lastStatus = status; }
    if (result.status === 'completed') {
      confirmPublished(result);
      console.log(`Confirmed: ${tag} signed AAB built and uploaded to Play closed testing. Store review/availability may still be pending.`);
      return;
    }
    await pause(15000);
  }
  throw Error('CI verification timed out. Use --verify; do not cut another release.');
}
try {
  const args = process.argv.slice(2);
  if (args[0] === '--verify') {
    if (args.length !== 2 || !/^v\d+\.\d+\.\d+-\d+$/.test(args[1])) throw Error('Usage: --verify vX.Y.Z-CODE');
    await verify(args[1]);
  } else {
    const plan = releasePlan(args, JSON.parse(read('app.json')), JSON.parse(read('package.json')), JSON.parse(read('package-lock.json')), read('distribution/whatsnew/whatsnew-en-US'));
    if (git('status', '--porcelain')) throw Error('Working tree is not clean. Commit first.');
    if (git('branch', '--show-current') !== 'main') throw Error('Releases must be cut from main.');
    if (git('tag', '--list', plan.tag)) throw Error(`Tag ${plan.tag} exists. Use --verify.`);
    console.log(`Release ${plan.tag}; synchronize app/package/lock versions and push main + tag atomically.`);
    if (plan.dryRun) console.log('--dry-run: nothing written or pushed.');
    else {
      gh('auth', 'status');
      git('fetch', 'origin', 'main', '--tags');
      git('merge-base', '--is-ancestor', 'origin/main', 'HEAD');
      if (git('tag', '--list', plan.tag)) throw Error(`Remote tag ${plan.tag} exists. Use --verify.`);
      const files = [['app.json', plan.app], ['package.json', plan.pkg], ['package-lock.json', plan.lock]];
      for (const [name, value] of files) {
        if (JSON.stringify(JSON.parse(read(name))) !== JSON.stringify(value)) writeFileSync(new URL(`../${name}`, import.meta.url), JSON.stringify(value, null, 2) + '\n');
      }
      git('add', ...files.map(([name]) => name));
      git('commit', '-m', `Release ${plan.tag}`);
      git('tag', plan.tag);
      try { git('push', '--atomic', 'origin', 'HEAD:refs/heads/main', `refs/tags/${plan.tag}`); }
      catch (error) { throw Error(`Push failed or result is uncertain. Local commit/tag retained. Check remote refs before retrying the same atomic push; do not bump again. ${error.message}`); }
      await verify(plan.tag);
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
