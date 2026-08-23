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
