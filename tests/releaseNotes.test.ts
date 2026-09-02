import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * Play rejects a release note over 500 characters per language, and the
 * whole upload fails with it. That is a miserable way to find out during an
 * automated release, and it has already happened once by hand — the first
 * notes were 502 characters.
 */
const DIR = new URL('../distribution/whatsnew/', import.meta.url);
const MAX_CHARS = 500;
const WORKFLOW = new URL('../.github/workflows/build-release.yml', import.meta.url);

const files = readdirSync(DIR).filter((f) => f.startsWith('whatsnew-'));

test('there are release notes to upload', () => {
  assert.ok(files.length > 0, 'no whatsnew-* files found');
  assert.ok(files.includes('whatsnew-en-US'), 'en-US notes are required');
});

for (const file of files) {
  test(`${file} fits inside Play's 500 character limit`, () => {
    const text = readFileSync(new URL(file, DIR), 'utf8');
    assert.ok(
      text.length <= MAX_CHARS,
      `${file} is ${text.length} characters, ${text.length - MAX_CHARS} over the limit`
    );
    assert.ok(text.trim().length > 0, `${file} is empty`);
  });
}

test('release workflow uses current Node-based actions and avoids a duplicate main build', () => {
  const workflow = readFileSync(WORKFLOW, 'utf8');

  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /node-version: '24'/);
  assert.match(workflow, /actions\/upload-artifact@v6/);
  assert.match(workflow, /actions\/download-artifact@v6/);
  assert.match(workflow, /softprops\/action-gh-release@v3/);
  assert.match(workflow, /r0adkll\/upload-google-play@v1\.1\.5/);
  assert.match(workflow, /tracks: alpha/);
  assert.match(workflow, /paths-ignore: \['app\.json'\]/);
  assert.doesNotMatch(workflow, /^\s+track: alpha$/m);
});
