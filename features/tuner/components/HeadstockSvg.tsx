import React from 'react';
import { View } from 'react-native';
import Svg, {
  Rect,
  Line,
  Circle,
  Ellipse,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

interface HeadstockProps {
  guitarType?: 'acoustic' | 'electric';
  highlightColor?: string;
  highlightedPeg?: number;
}

/**
 * Shared 3+3 headstock illustration.
 *
 * Geometry (viewBox 200x320):
 * - Crowned headstock face from y~16 down to the nut at y=232.
 * - Nut spans x 66..134; six string slots at 72..128 (11.2 apart).
 * - String posts on the face: left column x=77, right column x=123,
 *   at y = 70 / 122 / 174. Tuner buttons stick out past the edges.
 * - Strings fan from the nut up to their posts and terminate there;
 *   below the nut they continue down a fretboard so nothing floats.
 * - Peg order matches the on-screen labels: left top->bottom = 0,1,2,
 *   right top->bottom = 3,4,5.
 */

const POST_YS = [70, 122, 174];
const NUT_XS = [72, 83.2, 94.4, 105.6, 116.8, 128];
const LEFT_POST_X = 77;
const RIGHT_POST_X = 123;
const NUT_TOP = 232;
const NUT_BOTTOM = 241;

// Approximate x of the headstock edge at a given post y (for tuner shafts).
const LEFT_EDGE_X: Record<number, number> = { 70: 59, 122: 56, 174: 58 };

const FACE_PATH =
  'M 66 232 ' +
  'C 59 195, 55 160, 56 120 ' +
  'C 57 80, 60 50, 66 34 ' +
  'C 70 22, 79 15, 87 19 ' +
  'C 93 22, 97 26, 100 26 ' +
  'C 103 26, 107 22, 113 19 ' +
  'C 121 15, 130 22, 134 34 ' +
  'C 140 50, 143 80, 144 120 ' +
  'C 145 160, 141 195, 134 232 ' +
  'Z';

interface FinishColors {
  idPrefix: string;
  faceTop: string;
  faceMid: string;
  faceBottom: string;
  faceRim: string;
  grain: string | null;
  fretboardTop: string;
  fretboardBottom: string;
  nut: string;
  nutShadow: string;
  woundString: string;
  plainString: string;
}

function HeadstockBase({
  colors,
  highlightColor = '#4CAF50',
  highlightedPeg,
  label,
}: {
  colors: FinishColors;
  highlightColor?: string;
  highlightedPeg?: number;
  label: string;
}) {
  const p = colors.idPrefix;

  // String index -> post position. Left column: 0,1,2. Right column: 3,4,5.
  const postFor = (i: number) => ({
    x: i < 3 ? LEFT_POST_X : RIGHT_POST_X,
    y: POST_YS[i % 3],
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={200} height={320} viewBox="0 0 200 320" accessibilityLabel={label}>
        <Defs>
          <LinearGradient id={`${p}Face`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.faceTop} />
            <Stop offset="0.45" stopColor={colors.faceMid} />
            <Stop offset="1" stopColor={colors.faceBottom} />
          </LinearGradient>
          <LinearGradient id={`${p}Board`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.fretboardTop} />
            <Stop offset="1" stopColor={colors.fretboardBottom} />
          </LinearGradient>
          <LinearGradient id={`${p}Chrome`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#EDEDF2" />
            <Stop offset="0.5" stopColor="#B4B4BE" />
            <Stop offset="1" stopColor="#83838E" />
          </LinearGradient>
          <LinearGradient id={`${p}Post`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#E4E4EA" />
            <Stop offset="0.5" stopColor="#B9B9C2" />
            <Stop offset="1" stopColor="#8B8B96" />
          </LinearGradient>
        </Defs>

        {/* ---- Neck / fretboard below the nut (strings land on this) ---- */}
        <Path d="M 64 240 L 136 240 L 140 320 L 60 320 Z" fill={`url(#${p}Board)`} />
        {/* Fret wires */}
        <Line x1={62.9} y1={266} x2={137.1} y2={266} stroke="#6E6E78" strokeWidth={2.4} />
        <Line x1={62.9} y1={266.9} x2={137.1} y2={266.9} stroke="#C9C9D2" strokeWidth={0.7} opacity={0.55} />
        <Line x1={61.6} y1={297} x2={138.4} y2={297} stroke="#6E6E78" strokeWidth={2.4} />
        <Line x1={61.6} y1={297.9} x2={138.4} y2={297.9} stroke="#C9C9D2" strokeWidth={0.7} opacity={0.55} />

        {/* ---- Tuner buttons + shafts (behind the face edge) ---- */}
        {POST_YS.map((y, i) => {
          const edge = LEFT_EDGE_X[y];
          const leftActive = highlightedPeg === i;
          const rightActive = highlightedPeg === i + 3;
          return (
            <React.Fragment key={`tuner-${i}`}>
              {/* left shaft + button */}
              <Rect x={40} y={y - 2} width={edge - 40 + 6} height={4} rx={2} fill="#8E8E98" />
              <Ellipse
                cx={37}
                cy={y}
                rx={5.5}
                ry={10}
                fill={leftActive ? highlightColor : `url(#${p}Chrome)`}
                stroke="#55555E"
                strokeWidth={0.8}
              />
              <Ellipse cx={35.4} cy={y - 3} rx={1.6} ry={4} fill="#FFFFFF" opacity={0.35} />
              {/* right shaft + button (mirrored) */}
              <Rect
                x={200 - edge - 6}
                y={y - 2}
                width={edge - 40 + 6}
                height={4}
                rx={2}
                fill="#8E8E98"
              />
              <Ellipse
                cx={163}
                cy={y}
                rx={5.5}
                ry={10}
                fill={rightActive ? highlightColor : `url(#${p}Chrome)`}
                stroke="#55555E"
                strokeWidth={0.8}
              />
              <Ellipse cx={161.4} cy={y - 3} rx={1.6} ry={4} fill="#FFFFFF" opacity={0.35} />
            </React.Fragment>
          );
        })}

        {/* ---- Headstock face ---- */}
        <Path d={FACE_PATH} fill={`url(#${p}Face)`} stroke={colors.faceRim} strokeWidth={2} />

        {/* Wood grain */}
        {colors.grain && (
          <>
            <Path
              d="M 84 30 C 80 90, 82 160, 79 224"
              stroke={colors.grain}
              strokeWidth={1.2}
              fill="none"
              opacity={0.3}
            />
            <Path
              d="M 100 30 C 103 90, 98 160, 101 224"
              stroke={colors.grain}
              strokeWidth={1}
              fill="none"
              opacity={0.22}
            />
            <Path
              d="M 116 30 C 120 95, 117 165, 121 224"
              stroke={colors.grain}
              strokeWidth={1.2}
              fill="none"
              opacity={0.3}
            />
          </>
        )}

        {/* Soft sheen on the upper face */}
        <Ellipse cx={88} cy={64} rx={34} ry={44} fill="#FFFFFF" opacity={0.06} />

        {/* ---- Strings: nut slot -> post (terminate at the post) ---- */}
        {NUT_XS.map((x, i) => {
          const post = postFor(i);
          const wound = i < 3;
          return (
            <Line
              key={`string-top-${i}`}
              x1={x}
              y1={NUT_TOP + 1}
              x2={post.x}
              y2={post.y}
              stroke={wound ? colors.woundString : colors.plainString}
              strokeWidth={2.1 - i * 0.22}
              opacity={0.92}
            />
          );
        })}

        {/* ---- String posts (capstans) ---- */}
        {NUT_XS.map((_, i) => {
          const post = postFor(i);
          const active = highlightedPeg === i;
          return (
            <React.Fragment key={`post-${i}`}>
              {active && <Circle cx={post.x} cy={post.y} r={11} fill={highlightColor} opacity={0.3} />}
              <Circle
                cx={post.x}
                cy={post.y}
                r={6}
                fill={active ? highlightColor : `url(#${p}Post)`}
                stroke="#4A4A54"
                strokeWidth={1}
              />
              <Circle cx={post.x} cy={post.y} r={2.4} fill="#565660" />
            </React.Fragment>
          );
        })}

        {/* ---- Nut ---- */}
        <Rect x={64} y={NUT_TOP} width={72} height={NUT_BOTTOM - NUT_TOP} rx={2.5} fill={colors.nut} />
        <Rect x={64} y={NUT_BOTTOM - 2.4} width={72} height={2.4} rx={1.2} fill={colors.nutShadow} />

        {/* ---- Strings continuing down the fretboard ---- */}
        {NUT_XS.map((x, i) => {
          const wound = i < 3;
          const bottomX = 100 + (x - 100) * 1.12;
          return (
            <Line
              key={`string-neck-${i}`}
              x1={x}
              y1={NUT_BOTTOM}
              x2={bottomX}
              y2={320}
              stroke={wound ? colors.woundString : colors.plainString}
              strokeWidth={2.1 - i * 0.22}
              opacity={0.85}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const ACOUSTIC_FINISH: FinishColors = {
  idPrefix: 'ac',
  faceTop: '#7A4A28',
  faceMid: '#8C5A33',
  faceBottom: '#5A3620',
  faceRim: '#3B2312',
  grain: '#3A2212',
  fretboardTop: '#2E2018',
  fretboardBottom: '#1C130C',
  nut: '#EAE2CB',
  nutShadow: '#B8AE8E',
  woundString: '#C8B37E',
  plainString: '#D8D8DE',
};

const ELECTRIC_FINISH: FinishColors = {
  idPrefix: 'el',
  faceTop: '#33333D',
  faceMid: '#282832',
  faceBottom: '#1B1B23',
  faceRim: '#0E0E14',
  grain: null,
  fretboardTop: '#26262E',
  fretboardBottom: '#15151C',
  nut: '#E8E8EC',
  nutShadow: '#ABABB4',
  woundString: '#C4C4CC',
  plainString: '#DCDCE2',
};

export function AcousticHeadstock(props: HeadstockProps) {
  return (
    <HeadstockBase
      colors={ACOUSTIC_FINISH}
      label="Acoustic guitar headstock"
      highlightColor={props.highlightColor}
      highlightedPeg={props.highlightedPeg}
    />
  );
}

export function ElectricHeadstock(props: HeadstockProps) {
  return (
    <HeadstockBase
      colors={ELECTRIC_FINISH}
      label="Electric guitar headstock"
      highlightColor={props.highlightColor}
      highlightedPeg={props.highlightedPeg}
    />
  );
}

export default function HeadstockSvg({ guitarType = 'acoustic', ...props }: HeadstockProps) {
  if (guitarType === 'electric') {
    return <ElectricHeadstock {...props} />;
  }
  return <AcousticHeadstock {...props} />;
}
