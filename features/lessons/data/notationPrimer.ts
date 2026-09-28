export type PrimerClef = 'treble' | 'bass';
export const STAFF_PRIMER = {
  treble: [
    { string: 'G', soundingMidi: 55, writtenMidi: 67, written: 'G4', staffSteps: 2 },
    { string: 'B', soundingMidi: 59, writtenMidi: 71, written: 'B4', staffSteps: 4 },
    { string: 'high e', soundingMidi: 64, writtenMidi: 76, written: 'E5', staffSteps: 7 },
  ],
  bass: [
    { string: 'E', soundingMidi: 28, writtenMidi: 40, written: 'E2', staffSteps: -2 },
    { string: 'A', soundingMidi: 33, writtenMidi: 45, written: 'A2', staffSteps: 1 },
    { string: 'D', soundingMidi: 38, writtenMidi: 50, written: 'D3', staffSteps: 4 },
    { string: 'G', soundingMidi: 43, writtenMidi: 55, written: 'G3', staffSteps: 7 },
  ],
} as const;
