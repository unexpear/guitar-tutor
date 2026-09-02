import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Image as SvgImage, LinearGradient, Path, Stop } from 'react-native-svg';
import type { GuitarDesign } from '../../progression/guitarDesigns';

const ASSETS = {
  acoustic: {
    wood: require('../../../assets/guitars/acoustic-wood.png'),
    metallic: require('../../../assets/guitars/acoustic-metallic.png'),
    crystal: require('../../../assets/guitars/acoustic-crystal.png'),
  },
  electric: {
    wood: require('../../../assets/guitars/electric-wood.png'),
    metallic: require('../../../assets/guitars/electric-metallic.png'),
    crystal: require('../../../assets/guitars/electric-crystal.png'),
  },
} as const;

const ACOUSTIC_BODY =
  'M 72 164 C 61 164 59 177 63 190 C 67 204 51 226 51 253 C 51 284 70 300 100 304 C 130 300 149 284 149 253 C 149 226 133 204 137 190 C 141 177 139 164 128 164 C 116 164 110 172 100 172 C 90 172 84 164 72 164 Z';
const ELECTRIC_BODY =
  'M 70 188 C 60 184 56 195 55 212 C 53 234 47 247 48 274 C 49 297 69 307 100 308 C 131 307 151 297 152 274 C 153 247 147 234 145 212 C 144 195 140 184 130 188 C 119 192 113 204 100 204 C 87 204 81 192 70 188 Z';

function finishAsset(design: GuitarDesign) {
  const family = design.rarity === 'Starter' ? 'wood' : design.rarity === 'Legendary' ? 'crystal' : 'metallic';
  return ASSETS[design.guitarType][family];
}

export default function FullGuitarSvg({ design, width = 92, height = 150 }: { design: GuitarDesign; width?: number; height?: number }) {
  const gradientId = `guitar-${design.id}`;
  const body = design.guitarType === 'acoustic' ? ACOUSTIC_BODY : ELECTRIC_BODY;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 200 320" accessibilityLabel={`${design.name} ${design.guitarType} guitar`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={design.faceTop} />
            <Stop offset="0.5" stopColor={design.faceMid} />
            <Stop offset="1" stopColor={design.faceBottom} />
          </LinearGradient>
        </Defs>
        <SvgImage href={finishAsset(design)} x={0} y={0} width={200} height={320} preserveAspectRatio="xMidYMid meet" />
        <Path d={body} fill={`url(#${gradientId})`} opacity={design.rarity === 'Legendary' ? 0.18 : 0.3} />
      </Svg>
    </View>
  );
}
