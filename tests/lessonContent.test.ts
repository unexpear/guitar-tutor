import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LESSON_CONTENT } from '../features/lessons/data/lessonContent';
import { getDrill } from '../features/lessons/data/drills';

/**
 * Every lesson the lessons tab can open. The anatomy lesson is the one
 * deliberate exception — it renders an interactive diagram instead of prose.
 */
const ALL_LESSON_IDS = [
  'beginner-holding-the-guitar',
  'beginner-tuning-up',
  'beginner-guitar-anatomy',
  'beginner-reading-diagrams',
  'beginner-fretting-notes',
  'beginner-reading-tabs',
  'beginner-open-chords',
  'beginner-basic-strumming',
  'intermediate-barre-chords',
  'intermediate-fingerpicking',
  'intermediate-scales-101',
  'intermediate-music-theory',
  'advanced-improvisation',
  'advanced-techniques',
  'advanced-songwriting',
  'bass-first-notes',
  'bass-right-hand',
  'bass-fretboard',
  'bass-groove',
];

test('every lesson except anatomy has real instructional content', () => {
  for (const id of ALL_LESSON_IDS) {
    if (id === 'beginner-guitar-anatomy') continue;
    assert.ok(
      LESSON_CONTENT[id],
      `${id} has no lesson content`
    );
  }
  // The anatomy lesson must never grow prose content; it has its own component.
  assert.equal(LESSON_CONTENT['beginner-guitar-anatomy'], undefined);
});

test('every content key is a real lesson it is allowed to be', () => {
  for (const id of Object.keys(LESSON_CONTENT)) {
    assert.ok(
      ALL_LESSON_IDS.includes(id),
      `content exists for unknown lesson "${id}"`
    );
  }
});

test('every lesson has more than one section and every section is substantial', () => {
  for (const [id, sections] of Object.entries(LESSON_CONTENT)) {
    assert.ok(
      sections.length >= 2,
      `${id}: only ${sections.length} section(s)`
    );
    for (const s of sections) {
      assert.ok(s.heading.trim(), `${id}: an empty heading`);
      assert.ok(s.body.trim().length > 40, `${id}: "${s.heading}" is too thin to teach`);
    }
  }
});

test('the lessons that have a drill also have prose to support them', () => {
  // Reverse check: no drill is stranded without lesson content.
  for (const key of Object.keys(LESSON_CONTENT)) {
    if (getDrill(key)) {
      assert.ok(
        LESSON_CONTENT[key],
        `${key} has a drill but the lesson is missing`
      );
    }
  }
});

test('drill-bearing lessons point their learners at the drill', () => {
  // A drill a lesson never mentions is one a learner will never find. The
  // four known gaps had their prose fixed to say "open the drill"; the list
  // is now empty and stays that way — any new lesson that forgets its drill
  // will fail this test.
  const NEVER_MENTIONS_DRILL: string[] = [];
  const mentionsDrill: string[] = [];
  for (const [id, sections] of Object.entries(LESSON_CONTENT)) {
    if (!getDrill(id)) continue;
    const prose = sections.map((s) => s.heading + ' ' + s.body).join('\n');
    if (!/drill|practice|try it/i.test(prose)) mentionsDrill.push(id);
  }
  assert.deepEqual(mentionsDrill.sort(), [...NEVER_MENTIONS_DRILL].sort());
});
