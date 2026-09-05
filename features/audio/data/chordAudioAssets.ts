import { chordSampleMapping } from '../chordSampleMapping';

// Real Karoryfer Emilyguitar recordings, CC0. See assets/audio/recorded-chords.
const assets: Record<number, number> = {
  40: require('../../../assets/audio/recorded-chords/e2.wav'),
  42: require('../../../assets/audio/recorded-chords/gb2.wav'),
  45: require('../../../assets/audio/recorded-chords/a2.wav'),
  48: require('../../../assets/audio/recorded-chords/c3.wav'),
  51: require('../../../assets/audio/recorded-chords/eb3.wav'),
  54: require('../../../assets/audio/recorded-chords/gb3.wav'),
  57: require('../../../assets/audio/recorded-chords/a3.wav'),
  60: require('../../../assets/audio/recorded-chords/c4.wav'),
  63: require('../../../assets/audio/recorded-chords/eb4.wav'),
  66: require('../../../assets/audio/recorded-chords/gb4.wav'),
  69: require('../../../assets/audio/recorded-chords/a4.wav'),
};
export function recordedChordSample(note: string) {
  const mapping = chordSampleMapping(note);
  return mapping ? { asset: assets[mapping.root], rate: mapping.rate } : null;
}
