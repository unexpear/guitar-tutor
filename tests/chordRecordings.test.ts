import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CHORDS, chordMidiNotes, midiToNoteName } from '../features/chords/data/chords';
import { chordSampleMapping } from '../features/audio/chordSampleMapping';

test('every catalogue chord uses a real sample within one semitone of its root', () => {
  for (const chord of CHORDS) for (const midi of chordMidiNotes(chord)) {
    const sample = chordSampleMapping(midiToNoteName(midi));
    assert.ok(sample, chord.name);
    assert.ok(Math.abs(sample.root-midi)<=1);
    assert.ok(Math.abs(sample.root+12*Math.log2(sample.rate)-midi)<1e-9);
  }
  for (const note of ['B0','E6','bad','H4']) assert.equal(chordSampleMapping(note),null);
});

test('recordings are audible PCM16, bounded, and match the provenance hashes', () => {
  const folder = new URL('../assets/audio/recorded-chords/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json',folder),'utf8'));
  assert.equal(manifest.license,'CC0-1.0');
  assert.equal(manifest.samples.length,11);
  for(const entry of manifest.samples) {
    const wav=readFileSync(new URL(`${entry.name}.wav`,folder));
    assert.equal(createHash('sha256').update(wav).digest('hex'),entry.sha256);
    assert.equal(wav.readUInt16LE(20),1); assert.equal(wav.readUInt16LE(22),1);
    assert.equal(wav.readUInt32LE(24),44100); assert.equal(wav.readUInt16LE(34),16);
    let energy=0, peak=0;
    for(let i=44;i<wav.length;i+=2) { const value=wav.readInt16LE(i)/32768; energy+=value*value; peak=Math.max(peak,Math.abs(value)); }
    assert.ok(Math.sqrt(energy/((wav.length-44)/2))>.01);
    assert.ok(peak<.66); assert.equal(wav.readInt16LE(wav.length-2),0);
  }
});
