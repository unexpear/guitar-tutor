/** Learning paths are intentionally narrower than the tuner's instrument list. */
export const LEARNING_INSTRUMENTS = [
  { value: 'acoustic', label: 'Acoustic guitar' },
  { value: 'electric', label: 'Electric guitar' },
  { value: 'classical', label: 'Classical guitar' },
  { value: 'bass', label: '4-string bass' },
] as const;
export type LearningInstrument = typeof LEARNING_INSTRUMENTS[number]['value'];
export const isLearningInstrument = (value: unknown): value is LearningInstrument =>
  LEARNING_INSTRUMENTS.some(item => item.value === value);
export const learningInstrumentLabel = (value: LearningInstrument) =>
  LEARNING_INSTRUMENTS.find(item => item.value === value)!.label;
export const learningTuningId = (value: LearningInstrument) =>
  value === 'bass' ? 'bass-4-standard' : `guitar-${value}-standard`;

export function restoreLearningInstrument(saved: unknown, legacyGuitar: unknown): LearningInstrument {
  if (isLearningInstrument(saved)) return saved;
  return isLearningInstrument(legacyGuitar) ? legacyGuitar : 'acoustic';
}
