/** Learning paths are intentionally narrower than the tuner's instrument list. */
export const LEARNING_INSTRUMENTS = [
  { value: 'acoustic', label: 'Acoustic guitar' },
  { value: 'electric', label: 'Electric guitar' },
  { value: 'classical', label: 'Classical guitar' },
  { value: 'bass', label: '4-string bass' },
  { value: 'bass5', label: '5-string bass' },
  { value: 'bass6', label: '6-string bass' },
  { value: 'baritone', label: 'Baritone guitar' },
  { value: 'guitar7', label: '7-string guitar' },
  { value: 'guitar8', label: '8-string guitar' },
  { value: 'guitar12', label: '12-string guitar' },
  { value: 'ukulele', label: 'Ukulele' },
  { value: 'mandolin', label: 'Mandolin' },
  { value: 'banjo', label: '5-string banjo' },
  { value: 'violin', label: 'Violin' },
  { value: 'viola', label: 'Viola' },
  { value: 'cello', label: 'Cello' },
] as const;
export type LearningInstrument = typeof LEARNING_INSTRUMENTS[number]['value'];
export const isLearningInstrument = (value: unknown): value is LearningInstrument =>
  LEARNING_INSTRUMENTS.some(item => item.value === value);
export const learningInstrumentLabel = (value: LearningInstrument) =>
  LEARNING_INSTRUMENTS.find(item => item.value === value)!.label;
const TUNING_BY_PATH: Record<LearningInstrument, string> = {
  acoustic: 'guitar-acoustic-standard',
  electric: 'guitar-electric-standard',
  classical: 'guitar-classical-standard',
  bass: 'bass-4-standard',
  bass5: 'bass-5-standard',
  bass6: 'bass-6-standard',
  baritone: 'guitar-baritone-standard-b',
  guitar7: 'guitar-7-standard-b',
  guitar8: 'guitar-8-standard-f-sharp',
  guitar12: 'guitar-12-standard',
  ukulele: 'ukulele-high-g-standard',
  mandolin: 'mandolin-standard',
  banjo: 'banjo-5-open-g',
  violin: 'violin-standard',
  viola: 'viola-standard',
  cello: 'cello-standard',
};
export const learningTuningId = (value: LearningInstrument) => TUNING_BY_PATH[value];

export function restoreLearningInstrument(saved: unknown, legacyGuitar: unknown): LearningInstrument {
  if (isLearningInstrument(saved)) return saved;
  return isLearningInstrument(legacyGuitar) ? legacyGuitar : 'acoustic';
}
