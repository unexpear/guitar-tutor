/** Preserve exact bank samples; retune only the few accepted notes at its edges. */
export function referenceSampleMapping(note: string): { note: string; rate: number } | null {
  const match = /^([A-G])([#b]?)([0-8])$/.exec(note);
  if (!match) return null;
  const pitch: Record<string, number> = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  const midi = (Number(match[3])+1)*12 + pitch[match[1]] + (match[2]==='#'?1:match[2]==='b'?-1:0);
  // Covers every instrument profile's accepted 27–1800 Hz range.
  if (midi < 21 || midi > 93) return null;
  const root = Math.max(23, Math.min(88, midi)); // B0 through E6
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return { note: `${names[root%12]}${Math.floor(root/12)-1}`, rate:2**((midi-root)/12) };
}
