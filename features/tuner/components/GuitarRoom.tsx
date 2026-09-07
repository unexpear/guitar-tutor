import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import FullGuitarSvg from '../../games/locker/FullGuitarSvg';
import type { GuitarDesign } from '../../progression/guitarDesigns';
import type { GuitarModelId } from '../../progression/guitarModels';

/** Stationary scenery: never contributes layout height or intercepts taps. */
export default function GuitarRoom({ design, modelId, highlightedString }: {
  design: GuitarDesign; modelId?: GuitarModelId; highlightedString?: number;
}) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.room}>
    <Svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="room-wall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0f0f23" /><Stop offset="1" stopColor="#292633" />
        </LinearGradient>
        <LinearGradient id="room-floor" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#24232d" /><Stop offset="1" stopColor="#0f0f23" />
        </LinearGradient>
      </Defs>
      <Rect width={360} height={166} fill="url(#room-wall)" />
      <Path d="M 0 166 H 360 V 200 H 0 Z" fill="url(#room-floor)" />
      <Path d="M 0 166 H 360 M 120 166 L 84 200 M 240 166 L 276 200" stroke="#44404d" strokeWidth={0.6} opacity={0.45} />
      <Ellipse cx={180} cy={187} rx={63} ry={9} fill="#05050a" opacity={0.65} />
      <Path d="M 180 122 V 181 L 151 194 M 180 181 L 209 194 M 180 181 V 192" stroke="#77717a" strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
    <View style={styles.guitar}>
      <FullGuitarSvg design={design} modelId={modelId} width={112} height={180} highlightedString={highlightedString} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  room: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: 20 },
  guitar: { position: 'absolute', top: 0, bottom: 10, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
});
