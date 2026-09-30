/** Six-string tuner chips, low E through high e. Left-handed swaps sides. */
export function headstockColumns(leftHanded: boolean): readonly [readonly number[], readonly number[]] {
  const bass = [0, 1, 2] as const;
  const treble = [3, 4, 5] as const;
  return leftHanded ? [treble, bass] : [bass, treble];
}

/** Display order for a string row. Indexes stay the engine's indexes. */
export function visualStringOrder(count: number, leftHanded: boolean): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  return leftHanded ? order.reverse() : order;
}
