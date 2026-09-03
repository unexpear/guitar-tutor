export type HeadstockType = 'acoustic' | 'electric';

export interface HeadstockPoint {
  x: number;
  y: number;
}

export interface StringGuidance {
  path: string;
  peg: HeadstockPoint;
}

const MODEL_PEGS: Record<string, readonly HeadstockPoint[]> = {
  'acoustic-cutaway': [
    { x: 75, y: 168 }, { x: 77, y: 128 }, { x: 74, y: 86 },
    { x: 128, y: 86 }, { x: 127, y: 128 }, { x: 128, y: 168 },
  ],
  'electric-singlecut': [
    { x: 80, y: 191 }, { x: 88, y: 163 }, { x: 95, y: 136 },
    { x: 103, y: 108 }, { x: 110, y: 81 }, { x: 117, y: 54 },
  ],
};

const MODEL_NUT_POINTS: Record<string, readonly HeadstockPoint[]> = {
  'acoustic-cutaway': [
    { x: 80, y: 228 }, { x: 87, y: 228 }, { x: 94, y: 228 },
    { x: 106, y: 228 }, { x: 113, y: 228 }, { x: 120, y: 228 },
  ],
  'electric-singlecut': [
    { x: 83, y: 230 }, { x: 91, y: 230 }, { x: 99, y: 230 },
    { x: 107, y: 230 }, { x: 115, y: 230 }, { x: 123, y: 230 },
  ],
};

// Ordered low E through high E, matching the tuner engine's string indexes.
export const HEADSTOCK_PEGS: Record<HeadstockType, readonly HeadstockPoint[]> = {
  acoustic: [
    { x: 70, y: 164 },
    { x: 70, y: 119 },
    { x: 70, y: 73 },
    { x: 127, y: 73 },
    { x: 127, y: 119 },
    { x: 127, y: 164 },
  ],
  electric: [
    { x: 72, y: 204 },
    { x: 80, y: 175 },
    { x: 87, y: 146 },
    { x: 95, y: 117 },
    { x: 103, y: 87 },
    { x: 112, y: 58 },
  ],
};

const NUT_POINTS: Record<HeadstockType, readonly HeadstockPoint[]> = {
  acoustic: [
    { x: 74, y: 232 },
    { x: 83, y: 232 },
    { x: 92, y: 232 },
    { x: 107, y: 232 },
    { x: 115, y: 232 },
    { x: 123, y: 232 },
  ],
  electric: [
    { x: 78, y: 250 },
    { x: 87, y: 250 },
    { x: 96, y: 250 },
    { x: 104, y: 250 },
    { x: 113, y: 250 },
    { x: 122, y: 250 },
  ],
};

export function getStringGuidance(
  guitarType: HeadstockType,
  stringIndex: number | undefined,
  guitarModelId?: string,
): StringGuidance | null {
  if (stringIndex === undefined || !Number.isInteger(stringIndex) || stringIndex < 0 || stringIndex > 5) {
    return null;
  }

  const peg = (guitarModelId ? MODEL_PEGS[guitarModelId] : undefined)?.[stringIndex]
    ?? HEADSTOCK_PEGS[guitarType][stringIndex];
  const nut = (guitarModelId ? MODEL_NUT_POINTS[guitarModelId] : undefined)?.[stringIndex]
    ?? NUT_POINTS[guitarType][stringIndex];
  const neckX = 100 + (nut.x - 100) * 1.08;

  return {
    path: `M ${neckX} 300 L ${nut.x} ${nut.y} L ${peg.x} ${peg.y}`,
    peg,
  };
}
