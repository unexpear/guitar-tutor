#!/usr/bin/env node
/**
 * Cut a release: bump the Android version code, tag it, push.
 *
 * CI does the rest — builds the signed AAB and, once
 * PLAY_SERVICE_ACCOUNT_JSON exists, uploads it to the closed testing track.
 *
 *   npm run release              bump the version code only
 *   npm run release -- 1.0.1     also set the version name testers see
 *   npm run release -- --dry-run show what would happen and stop
 *
 * The version code must go up on every upload: Play rejects a duplicate,
 * and android/ is gitignored, so app.json is the only thing that sets it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url);
const APP_JSON = new URL('app.json', ROOT);
const NOTES = new URL('distribution/whatsnew/whatsnew-en-US', ROOT);
const MAX_NOTE_CHARS = 500;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const version = args.find((a) => /^\d+\.\d+\.\d+$/.test(a));

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const fail = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

// --- checks that are cheaper to fail here than in CI ---------------------
if (git('status', '--porcelain')) {
  fail('Working tree is not clean. Commit or stash first.');
}

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== 'main') {
  fail(`On branch "${branch}". Releases are cut from main.`);
}

const notes = readFileSync(NOTES, 'utf8');
if (notes.length > MAX_NOTE_CHARS) {
  fail(
    `Release notes are ${notes.length} characters; Play's limit is ${MAX_NOTE_CHARS}. ` +
      `Trim distribution/whatsnew/whatsnew-en-US.`
  );
}

// --- bump ----------------------------------------------------------------
const config = JSON.parse(readFileSync(APP_JSON, 'utf8'));
const previousCode = config.expo.android.versionCode;
if (typeof previousCode !== 'number') {
  fail('app.json has no expo.android.versionCode. Set one before releasing.');
}

const nextCode = previousCode + 1;
config.expo.android.versionCode = nextCode;
if (version) config.expo.version = version;

const finalVersion = config.expo.version;
const tag = `v${finalVersion}-${nextCode}`;

if (git('tag', '--list', tag)) {
  fail(`Tag ${tag} already exists.`);
}

console.log(`
  version      ${finalVersion}${version ? ' (updated)' : ''}
  versionCode  ${previousCode} -> ${nextCode}
  tag          ${tag}
  notes        ${notes.length}/${MAX_NOTE_CHARS} characters
`);

if (dryRun) {
  console.log('  --dry-run: nothing written.\n');
  process.exit(0);
}

writeFileSync(APP_JSON, JSON.stringify(config, null, 2) + '\n');

git('add', 'app.json');
git('commit', '-m', `Release ${tag}`);
git('tag', tag);
git('push', 'origin', 'HEAD');
git('push', 'origin', tag);

console.log(`  Pushed ${tag}. CI is building it now:
  https://github.com/unexpear/guitar-tutor/actions
`);
