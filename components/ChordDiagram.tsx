import React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { findBarres } from '../features/chords/data/barres';
import { chordFretWindow, DIAGRAM_FRET_COUNT } from '../features/chords/data/fretWindow';
import { Chord } from '../features/chords/data/chords';

const FRETBOARD_STRING_COUNT = 6;
const FRET_COUNT = DIAGRAM_FRET_COUNT;
/** Standard-tuning string letters, low E on the left. */
const STRING_LETTERS = ['E', 'A', 'D', 'G', 'B', 'e'];

/** Flat, palette-native diagram colors (navy surface, slate lines, green accent). */
/** A finger pressing two or more strings at one fret: draw it as a bar. */

const STRING_COLOR = 'rgba(148, 158, 196, 0.75)';
const FRET_COLOR = 'rgba(148, 158, 196, 0.32)';
const NUT_COLOR = '#8f98c2';

export default function ChordDiagram({ chord, small }: { chord: Chord; small?: boolean }) {
  const color = Colors.dark;
  const { startFret, showNut } = chordFretWindow(chord);
  // Finger-dot radius drives all other proportions.
  const dotR = small ? 7 : 15;
  const boardW = small ? 82 : 188;
  const boardH = small ? 92 : 196;
  const nutH = small ? 3 : 5;
  const markerH = small ? 15 : 24; // X / O row above the nut
  const edge = small ? 3 : 5; // fretboard overhang past the outer strings
  const cellH = boardH / FRET_COUNT;
  const cellW = boardW / (FRETBOARD_STRING_COUNT - 1);
  const padBase = dotR + 2; // room for dots on the outer strings
  // Shapes away from the nut carry a "5fr" position label on the left.
  const posLabelW = showNut ? 0 : small ? 15 : 22;
  const pad = padBase + posLabelW;
  const boardTop = markerH + nutH;
  const openR = small ? 4 : 6.5;
  const labelH = small ? 0 : 20;
  // Bass strings are subtly heavier than the trebles — one color, graded weight.
  const stringWeights = small
    ? [1.6, 1.5, 1.4, 1.3, 1.2, 1.1]
    : [2.4, 2.2, 2, 1.8, 1.6, 1.5];

  const barres = findBarres(chord);
  // Strings covered by a barre are drawn as part of the bar, not as loose dots.
  const barredStrings = new Set<number>();
  barres.forEach((b) => {
    for (let i = b.from; i <= b.to; i++) {
      if (chord.strings[i] === b.fret && chord.fingers[i] === b.finger) barredStrings.add(i);
    }
  });

  const width = boardW + pad + padBase;
  const height = boardTop + boardH + labelH + 2;
  const boardX = pad - edge;
  const boardWFull = boardW + edge * 2;
  const fretH = small ? 1.25 : 1.75;
  /** Vertical centre of a fret cell, in the diagram's sliding window. */
  const fretY = (fret: number) => boardTop + (fret - startFret + 0.5) * cellH;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Fretboard surface — barely-there top light on the navy panel */}
          <LinearGradient id="cdBoard" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#232342" />
            <Stop offset="1" stopColor="#1c1c35" />
          </LinearGradient>
          {/* Finger dot — soft top-left light */}
          <RadialGradient id="cdDot" cx="0.35" cy="0.3" r="0.85">
            <Stop offset="0" stopColor="#84da88" />
            <Stop offset="0.55" stopColor={Colors.success} />
            <Stop offset="1" stopColor="#3a8a3f" />
          </RadialGradient>
        </Defs>

        {/* Fretboard surface */}
        <Rect
          x={boardX}
          y={boardTop}
          width={boardWFull}
          height={boardH}
          rx={small ? 4 : 6}
          fill="url(#cdBoard)"
        />
        {/* square off the top corners so the board meets the nut cleanly */}
        <Rect x={boardX} y={boardTop} width={boardWFull} height={small ? 5 : 8} fill="#232342" />

        {/* Frets — flat hairlines in the panel's slate tone */}
        {[...Array(FRET_COUNT)].map((_, i) => {
          const y = boardTop + (i + 1) * cellH - fretH;
          return (
            <Rect
              key={`fret-${i}`}
              x={boardX}
              y={y}
              width={boardWFull}
              height={fretH}
              fill={FRET_COLOR}
            />
          );
        })}

        {/* Strings — one slate tone, weight graded bass to treble */}
        {[...Array(FRETBOARD_STRING_COUNT)].map((_, i) => {
          const w = stringWeights[i];
          return (
            <Rect
              key={`string-${i}`}
              x={pad + i * cellW - w / 2}
              y={boardTop}
              width={w}
              height={boardH}
              rx={w / 2}
              fill={STRING_COLOR}
            />
          );
        })}

        {/* Nut — slim slate bar, only when the window sits at the nut.
            Up the neck it becomes an ordinary fret and the position label
            below tells you where you are. */}
        <Rect
          x={boardX}
          y={markerH}
          width={boardWFull}
          height={showNut ? nutH : fretH}
          rx={showNut ? nutH / 2 : 0}
          fill={showNut ? NUT_COLOR : FRET_COLOR}
        />


        {/* Barres: one rounded bar per finger that spans multiple strings */}
        {barres.map((b) => {
          const x1 = pad + b.from * cellW;
          const x2 = pad + b.to * cellW;
          const cy = fretY(b.fret);
          const h = dotR * 2;
          return (
            <React.Fragment key={`barre-${b.finger}-${b.fret}`}>
              <Rect
                x={x1 - dotR}
                y={cy - dotR}
                width={x2 - x1 + dotR * 2}
                height={h}
                rx={dotR}
                fill={Colors.success}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={small ? 1 : 1.2}
              />
              <SvgText
                x={x1}
                y={cy + (small ? 3.5 : 5.5)}
                fontSize={small ? 10 : 15}
                fontWeight="800"
                fill="#fff"
                textAnchor="middle"
              >
                {b.finger}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Position label for shapes away from the nut, e.g. "5fr". Drawn
            after the barres and clear of the bar's rounded left end. */}
        {!showNut && (
          <SvgText
            x={pad - dotR - 3}
            y={fretY(startFret) + (small ? 3 : 4.5)}
            fontSize={small ? 8 : 12}
            fontWeight="700"
            fill={color.muted}
            textAnchor="end"
          >
            {`${startFret}fr`}
          </SvgText>
        )}

        {/* Per-string markers: muted ×, open ○, or finger dot */}
        {chord.strings.map((fret, stringIdx) => {
          const cx = pad + stringIdx * cellW;
          if (fret === -1) {
            const s = small ? 3 : 4.5;
            const cy = markerH - (small ? 6 : 9);
            return (
              <React.Fragment key={`x-${stringIdx}`}>
                <Line
                  x1={cx - s}
                  y1={cy - s}
                  x2={cx + s}
                  y2={cy + s}
                  stroke={color.muted}
                  strokeWidth={small ? 1.5 : 2}
                  strokeLinecap="round"
                  opacity={0.75}
                />
                <Line
                  x1={cx + s}
                  y1={cy - s}
                  x2={cx - s}
                  y2={cy + s}
                  stroke={color.muted}
                  strokeWidth={small ? 1.5 : 2}
                  strokeLinecap="round"
                  opacity={0.75}
                />
              </React.Fragment>
            );
          }
          if (fret === 0) {
            return (
              <Circle
                key={`open-${stringIdx}`}
                cx={cx}
                cy={markerH - (small ? 6 : 9)}
                r={openR}
                stroke={Colors.success}
                strokeWidth={small ? 1.5 : 2}
                fill="none"
              />
            );
          }
          if (barredStrings.has(stringIdx)) return null;
          const finger = chord.fingers[stringIdx];
          const cy = fretY(fret);
          return (
            <React.Fragment key={`dot-${stringIdx}`}>
              <Circle
                cx={cx}
                cy={cy}
                r={dotR}
                fill={Colors.success}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={small ? 1 : 1.2}
              />
              {finger > 0 && (
                <SvgText
                  x={cx}
                  y={cy + (small ? 3.5 : 5.5)}
                  fontSize={small ? 10 : 15}
                  fontWeight="800"
                  fill="#fff"
                  textAnchor="middle"
                >
                  {finger}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* String letters */}
        {!small &&
          STRING_LETTERS.map((letter, i) => (
            <SvgText
              key={`letter-${i}`}
              x={pad + i * cellW}
              y={boardTop + boardH + 15}
              fontSize={10.5}
              fontWeight="700"
              fill={chord.strings[i] === -1 ? 'rgba(156,163,175,0.4)' : color.muted}
              textAnchor="middle"
            >
              {letter}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}

export { findBarres } from '../features/chords/data/barres';
export type { Barre } from '../features/chords/data/barres';
