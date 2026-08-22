import { Chord } from './chords';

/** How many frets a diagram shows at once. */
export const DIAGRAM_FRET_COUNT = 5;

export interface FretWindow {
  /** Fret drawn in the top cell of the diagram. */
  startFret: number;
  /**
   * True when the window sits at the nut, so the diagram draws the nut bar.
   * False for shapes up the neck, which get a position label instead.
   */
  showNut: boolean;
}

/**
 * Which slice of the neck a chord's diagram should show.
 *
 * Open shapes sit at the nut. Anything reaching past the fifth fret slides
 * the window up so the whole shape fits, and the caller labels the position
 * (e.g. "5fr") because the nut is no longer in view.
 */
export function chordFretWindow(
  chord: Chord,
  fretCount = DIAGRAM_FRET_COUNT
): FretWindow {
  const fretted = chord.strings.filter((f) => f > 0);
  if (fretted.length === 0) return { startFret: 1, showNut: true };

  const highest = Math.max(...fretted);
  if (highest <= fretCount) return { startFret: 1, showNut: true };

  // Anchor the window on the lowest fretted note: that fret is the shape's
  // position, and it is what the "5fr" label names. A shape wider than the
  // window is not playable by a human hand, so there is nothing to trade off.
  return { startFret: Math.min(...fretted), showNut: false };
}
