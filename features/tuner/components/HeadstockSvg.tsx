import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Image as SvgImage, LinearGradient, Path, Stop } from 'react-native-svg';
import type { GuitarDesign } from '../../progression/guitarDesigns';

interface HeadstockProps {
  guitarType?: 'acoustic' | 'electric';
  design?: GuitarDesign;
  highlightColor?: string;
  highlightedPeg?: number;
  width?: number;
  height?: number;
}

const ASSETS = {
  acoustic: {
    wood: require('../../../assets/guitars/headstock-acoustic-wood.png'),
    metallic: require('../../../assets/guitars/headstock-acoustic-metallic.png'),
    crystal: require('../../../assets/guitars/headstock-acoustic-crystal.png'),
  },
  electric: {
    wood: require('../../../assets/guitars/headstock-electric-wood.png'),
    metallic: require('../../../assets/guitars/headstock-electric-metallic.png'),
    crystal: require('../../../assets/guitars/headstock-electric-crystal.png'),
  },
} as const;

const ACOUSTIC_FACE =
  'M 58 12 C 72 5 86 6 100 15 C 114 6 128 5 142 12 L 138 202 C 136 220 127 231 121 238 L 79 238 C 73 231 64 220 62 202 Z';
const ELECTRIC_FACE = 'M 105 10 C 126 10 141 17 145 26 L 128 232 L 69 232 L 70 198 C 91 168 103 91 105 10 Z';
const ACOUSTIC_PEGS = [
  { x: 70, y: 73 }, { x: 70, y: 119 }, { x: 70, y: 164 },
  { x: 127, y: 73 }, { x: 127, y: 119 }, { x: 127, y: 164 },
];
const ELECTRIC_PEGS = [
  { x: 112, y: 58 }, { x: 103, y: 87 }, { x: 95, y: 117 },
  { x: 87, y: 146 }, { x: 80, y: 175 }, { x: 72, y: 204 },
];

function finishFamily(design?: GuitarDesign) {
  if (!design || design.rarity === 'Starter') return 'wood';
  return design.rarity === 'Legendary' ? 'crystal' : 'metallic';
}

export default function HeadstockSvg({
  guitarType = 'acoustic',
  design,
  highlightColor = '#4CAF50',
  highlightedPeg,
  width = 200,
  height = 320,
}: HeadstockProps) {
  const family = finishFamily(design);
  const pegs = guitarType === 'acoustic' ? ACOUSTIC_PEGS : ELECTRIC_PEGS;
  const face = guitarType === 'acoustic' ? ACOUSTIC_FACE : ELECTRIC_FACE;
  const gradientId = `headstock-${guitarType}-${design?.id ?? 'default'}`;
  const selectedPeg = highlightedPeg === undefined ? undefined : pegs[highlightedPeg];

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height} viewBox="0 0 200 320" accessibilityLabel={`${design?.name ?? (guitarType === 'acoustic' ? 'Acoustic' : 'Electric')} guitar headstock`}>
        {design && (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={design.faceTop} />
              <Stop offset="0.5" stopColor={design.faceMid} />
              <Stop offset="1" stopColor={design.faceBottom} />
            </LinearGradient>
          </Defs>
        )}
        <SvgImage href={ASSETS[guitarType][family]} x={0} y={0} width={200} height={300} preserveAspectRatio="xMidYMid meet" />
        {design && <Path d={face} fill={`url(#${gradientId})`} opacity={design.rarity === 'Legendary' ? 0.16 : 0.27} />}
        {selectedPeg && (
          <>
            <Circle cx={selectedPeg.x} cy={selectedPeg.y} r={15} fill={highlightColor} opacity={0.2} />
            <Circle cx={selectedPeg.x} cy={selectedPeg.y} r={10} fill="none" stroke={highlightColor} strokeWidth={3} />
            <Circle cx={selectedPeg.x} cy={selectedPeg.y} r={4} fill={highlightColor} opacity={0.8} />
          </>
        )}
      </Svg>
    </View>
  );
}

export function AcousticHeadstock(props: HeadstockProps) {
  return <HeadstockSvg {...props} guitarType="acoustic" />;
}

export function ElectricHeadstock(props: HeadstockProps) {
  return <HeadstockSvg {...props} guitarType="electric" />;
}
