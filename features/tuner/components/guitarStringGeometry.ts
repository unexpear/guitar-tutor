import type { GuitarModelId } from '../../progression/guitarModels';

// Nut/saddle endpoints on the bundled 512x768 front renders. The SVG image
// fits a 200x320 viewBox, with ten units of letterboxing above and below.
const ANCHORS: Partial<Record<GuitarModelId, number[]>> = {
  'acoustic-grand': [239, 272, 124, 231, 279, 595],
  'acoustic-cutaway': [244, 275, 137, 242, 284, 591],
  'electric-doublecut': [208, 234, 143, 199, 244, 648],
  'electric-singlecut': [245, 272, 137, 237, 278, 626],
};
export function guitarStringPath(model: GuitarModelId, index: number): string | null {
  if (!Number.isInteger(index) || index < 0 || index > 5) return null;
  const anchors=ANCHORS[model];
  if(!anchors)return null;
  const [nx0, nx1, ny, bx0, bx1, by] = anchors;
  const fraction = index / 5;
  return `M ${(nx0 + (nx1 - nx0) * fraction) / 2.56} ${ny / 2.56 + 10} L ${(bx0 + (bx1 - bx0) * fraction) / 2.56} ${by / 2.56 + 10}`;
}
