/** Sample roots verified against Emilyguitar's emily_clean.sfz pitch_keycenter. */
export const CHORD_SAMPLE_ROOTS = [40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69] as const;
export function chordSampleMapping(note: string): { root: number; rate: number } | null {
  const match = /^([A-G])(#?)(-?\d+)$/.exec(note);
  if (!match) return null;
  const pitchClasses: Record<string, number> = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  const pitch = pitchClasses[match[1]];
  const midi = (Number(match[3])+1)*12 + pitch + (match[2] ? 1 : 0);
  // Covers every catalogue chord; other instruments retain the existing bank.
  if (midi < 40 || midi > 70) return null;
  const root = CHORD_SAMPLE_ROOTS.reduce<number>((best, candidate) => Math.abs(candidate-midi)<Math.abs(best-midi) ? candidate : best, 40);
  return { root, rate: 2 ** ((midi-root)/12) };
}
