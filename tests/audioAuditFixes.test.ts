import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { referenceSampleMapping } from '../features/audio/referenceSampleMapping';
import { isReferenceAudible, trainingAudioSettings } from '../features/audio/audibility';
import { guideChordMidiNotes } from '../features/songs/songPractice';
import { CHORDS, chordMidiNotes } from '../features/chords/data/chords';
import { TUNING_PRESETS } from '../features/tuner/data/tunings';

test('flat spellings and octave-crossing accidentals resolve to exact reference samples', () => {
  assert.deepEqual(referenceSampleMapping('Bb2'), {note:'A#2',rate:1});
  assert.deepEqual(referenceSampleMapping('Cb1'), {note:'B0',rate:1});
  assert.deepEqual(referenceSampleMapping('B#5'), {note:'C6',rate:1});
  assert.equal(referenceSampleMapping('not a note'),null);
});
test('edge notes use calibrated frequency ratios; bank notes remain unchanged', () => {
  assert.deepEqual(referenceSampleMapping('A0'),{note:'B0',rate:2**(-2/12)});
  assert.deepEqual(referenceSampleMapping('F6'),{note:'E6',rate:2**(1/12)});
  assert.deepEqual(referenceSampleMapping('A4'),{note:'A4',rate:1});
  for(const preset of TUNING_PRESETS) for(const note of preset.strings) {
    const mapped=referenceSampleMapping(note);assert.ok(mapped,`${preset.name}/${note}`);
    assert.ok(existsSync(new URL(`../assets/audio/${encodeURIComponent(mapped.note)}.wav`,import.meta.url)));
    assert.equal(mapped.rate,1);
  }
});
test('audio games treat zero volume as muted and preserve nonzero preferences',()=>{
  assert.equal(isReferenceAudible({soundsEnabled:true,sampleVolume:0}),false);
  assert.equal(isReferenceAudible({soundsEnabled:false,sampleVolume:80}),false);
  assert.equal(isReferenceAudible(trainingAudioSettings({sampleVolume:0})),true);
  assert.equal(trainingAudioSettings({sampleVolume:23}).sampleVolume,23);
});
test('guide playback raises capo shapes to the intended sounding chord',()=>{
  const pcs=(notes:number[])=>[...new Set(notes.map(n=>n%12))].sort();
  assert.deepEqual(pcs(guideChordMidiNotes('C',0,2)),pcs(chordMidiNotes(CHORDS.find(c=>c.name==='C')!)));
  assert.deepEqual(guideChordMidiNotes('C',0,0),chordMidiNotes(CHORDS.find(c=>c.name==='C')!));
  assert.deepEqual(pcs(guideChordMidiNotes('C',2,2)),[2,6,9]);
});
