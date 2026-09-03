import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Image as SvgImage, LinearGradient, Path, Stop } from 'react-native-svg';
import type { GuitarDesign } from '../../progression/guitarDesigns';
import { DEFAULT_GUITAR_MODEL_IDS, type GuitarModelId } from '../../progression/guitarModels';
import { FULL_GUITAR_MODEL_ASSETS, FULL_GUITAR_PLAYER_SKINS, type GuitarFinishFamily } from '../../progression/guitarModelAssets';

const ACOUSTIC_BODY =
  'M 72 164 C 61 164 59 177 63 190 C 67 204 51 226 51 253 C 51 284 70 300 100 304 C 130 300 149 284 149 253 C 149 226 133 204 137 190 C 141 177 139 164 128 164 C 116 164 110 172 100 172 C 90 172 84 164 72 164 Z';
const ELECTRIC_BODY =
  'M 70 188 C 60 184 56 195 55 212 C 53 234 47 247 48 274 C 49 297 69 307 100 308 C 131 307 151 297 152 274 C 153 247 147 234 145 212 C 144 195 140 184 130 188 C 119 192 113 204 100 204 C 87 204 81 192 70 188 Z';
const ACOUSTIC_CUTAWAY_BODY =
  'M 72 158 C 60 158 58 173 61 191 C 64 208 48 225 45 254 C 42 285 63 304 100 308 C 137 304 157 284 153 254 C 150 230 135 211 137 195 C 140 180 134 171 123 171 C 114 171 111 164 108 158 Z';
const ELECTRIC_SINGLECUT_BODY =
  'M 73 174 C 61 172 58 188 59 210 C 60 230 50 250 52 276 C 54 299 72 308 101 309 C 132 308 149 297 150 275 C 151 249 142 228 143 210 C 144 196 139 185 131 187 C 120 190 116 202 106 204 L 99 204 C 91 194 84 177 73 174 Z';

const BODY_PATHS: Partial<Record<GuitarModelId, string>> = {
  'acoustic-cutaway': ACOUSTIC_CUTAWAY_BODY,
  'electric-singlecut': ELECTRIC_SINGLECUT_BODY,
};

function finishFamily(design: GuitarDesign): GuitarFinishFamily {
  return design.rarity === 'Starter' ? 'wood' : design.rarity === 'Legendary' ? 'crystal' : 'metallic';
}

export default function FullGuitarSvg({ design, modelId, width = 92, height = 150 }: { design: GuitarDesign; modelId?: GuitarModelId; width?: number; height?: number }) {
  const gradientId = `guitar-${design.id}`;
  const compatibleModelId = modelId?.startsWith(design.guitarType)
    ? modelId
    : DEFAULT_GUITAR_MODEL_IDS[design.guitarType];
  const body = BODY_PATHS[compatibleModelId]
    ?? (design.guitarType === 'acoustic' ? ACOUSTIC_BODY : ELECTRIC_BODY);
  const bakedSkin = FULL_GUITAR_PLAYER_SKINS[compatibleModelId][design.id];
  const asset = bakedSkin ?? FULL_GUITAR_MODEL_ASSETS[compatibleModelId][finishFamily(design)];
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
        <SvgImage href={asset} x={0} y={0} width={200} height={320} preserveAspectRatio="xMidYMid meet" />
        {!bakedSkin && <Path d={body} fill={`url(#${gradientId})`} opacity={design.rarity === 'Legendary' ? 0.18 : 0.3} />}
      </Svg>
    </View>
  );
}
