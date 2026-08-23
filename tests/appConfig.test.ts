import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * app.json is the only source of truth for the Android build: `android/` is
 * gitignored and CI regenerates it with `expo prebuild --clean`. Anything
 * missing here silently falls back to an Expo default, which is how the
 * version code sat at 1 while a version-code-1 bundle was already live on
 * Play — every future upload would have been rejected as a duplicate.
 */
const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const expo = config.expo;
const android = expo.android;

test('the app declares a version and an Android version code', () => {
  assert.match(expo.version, /^\d+\.\d+\.\d+$/, `odd version "${expo.version}"`);
  assert.equal(
    typeof android.versionCode,
    'number',
    'android.versionCode is missing, so prebuild would default it to 1'
  );
  assert.ok(Number.isInteger(android.versionCode), 'versionCode must be an integer');
  assert.ok(android.versionCode >= 1, 'versionCode must be positive');
});

test('the version code is past the one already published to Play', () => {
  // Version code 1 went out on the closed testing track on 2026-08-22.
  // Play rejects a duplicate, so this can only ever go up.
  assert.ok(
    android.versionCode > 1,
    `versionCode ${android.versionCode} is already used on Play`
  );
});

test('the package name is the one Play knows', () => {
  assert.equal(android.package, 'com.standardtune.guitar');
});

test('the app asks for the mic and nothing else', () => {
  assert.deepEqual(android.permissions, ['android.permission.RECORD_AUDIO']);
  assert.ok(
    android.blockedPermissions.includes('android.permission.SYSTEM_ALERT_WINDOW'),
    'SYSTEM_ALERT_WINDOW must stay blocked - it is a Play policy flag'
  );
});
