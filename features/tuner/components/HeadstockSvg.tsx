import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Image as SvgImage, LinearGradient, Path, Stop } from 'react-native-svg';
import type { GuitarDesign } from '../../progression/guitarDesigns';
import { DEFAULT_GUITAR_MODEL_IDS, type GuitarModelId } from '../../progression/guitarModels';
import { HEADSTOCK_MODEL_ASSETS, type GuitarFinishFamily } from '../../progression/guitarModelAssets';
import { getStringGuidance } from '../headstockGuidance';

interface HeadstockProps {
  guitarType?: 'acoustic' | 'electric';
  design?: GuitarDesign;
  modelId?: GuitarModelId;
  highlightColor?: string;
  highlightedPeg?: number;
  width?: number;
  height?: number;
  animateHighlight?: boolean;
}

const ACOUSTIC_FACE =
  'M 58 12 C 72 5 86 6 100 15 C 114 6 128 5 142 12 L 138 202 C 136 220 127 231 121 238 L 79 238 C 73 231 64 220 62 202 Z';
const ELECTRIC_FACE = 'M 105 10 C 126 10 141 17 145 26 L 128 232 L 69 232 L 70 198 C 91 168 103 91 105 10 Z';
const ACOUSTIC_CUTAWAY_FACE =
  'M 65 31 C 82 20 113 20 136 34 L 148 191 C 148 211 132 224 121 232 L 79 232 C 68 224 52 211 52 191 Z';
const ELECTRIC_SINGLECUT_FACE =
  'M 116 9 C 135 17 145 31 147 52 L 143 197 C 139 215 128 225 122 230 L 78 230 L 79 203 C 96 169 108 76 116 9 Z';
const GUIDANCE_GOLD = '#FFD166';

function finishFamily(design?: GuitarDesign): GuitarFinishFamily {
  if (!design || design.rarity === 'Starter') return 'wood';
  return design.rarity === 'Legendary' ? 'crystal' : 'metallic';
}

export default function HeadstockSvg({
  guitarType = 'acoustic',
  design,
  modelId,
  highlightColor = '#4CAF50',
  highlightedPeg,
  width = 200,
  height = 320,
  animateHighlight = true,
}: HeadstockProps) {
  const family = finishFamily(design);
  const compatibleModelId = modelId?.startsWith(guitarType)
    ? modelId
    : DEFAULT_GUITAR_MODEL_IDS[guitarType];
  const asset = HEADSTOCK_MODEL_ASSETS[compatibleModelId][family];
  const face = compatibleModelId === 'acoustic-cutaway'
    ? ACOUSTIC_CUTAWAY_FACE
    : compatibleModelId === 'electric-singlecut'
      ? ELECTRIC_SINGLECUT_FACE
      : guitarType === 'acoustic'
        ? ACOUSTIC_FACE
        : ELECTRIC_FACE;
  const gradientId = `headstock-${guitarType}-${design?.id ?? 'default'}`;
  const guidance = useMemo(
    () => getStringGuidance(guitarType, highlightedPeg, compatibleModelId),
    [guitarType, highlightedPeg, compatibleModelId],
  );
  const pulseOpacity = useRef(new Animated.Value(0.68)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    pulseOpacity.stopAnimation();
    if (!guidance || reduceMotion || !animateHighlight) {
      pulseOpacity.setValue(guidance ? 0.78 : 0);
      return;
    }

    pulseOpacity.setValue(0.46);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.46,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [guidance, pulseOpacity, reduceMotion, animateHighlight]);

  return (
    <View style={{ alignItems: 'center', height, width }}>
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
        <SvgImage href={asset} x={0} y={0} width={200} height={300} preserveAspectRatio="xMidYMid meet" />
        {design && <Path d={face} fill={`url(#${gradientId})`} opacity={design.rarity === 'Legendary' ? 0.16 : 0.27} />}
        {guidance && (
          <>
            <Circle cx={guidance.peg.x} cy={guidance.peg.y} r={13} fill={highlightColor} opacity={0.15} />
            <Circle cx={guidance.peg.x} cy={guidance.peg.y} r={9} fill="none" stroke={highlightColor} strokeWidth={2} />
            <Circle cx={guidance.peg.x} cy={guidance.peg.y} r={3.5} fill={highlightColor} opacity={0.9} />
          </>
        )}
      </Svg>
      {guidance && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: pulseOpacity }]}>
          <Svg width={width} height={height} viewBox="0 0 200 320">
            <Path
              d={guidance.path}
              fill="none"
              stroke={GUIDANCE_GOLD}
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.14}
            />
            <Path
              d={guidance.path}
              fill="none"
              stroke={GUIDANCE_GOLD}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.92}
            />
            <Circle cx={guidance.peg.x} cy={guidance.peg.y} r={18} fill={GUIDANCE_GOLD} opacity={0.1} />
            <Circle cx={guidance.peg.x} cy={guidance.peg.y} r={14} fill="none" stroke={GUIDANCE_GOLD} strokeWidth={4} opacity={0.34} />
            <Circle cx={guidance.peg.x} cy={guidance.peg.y} r={10} fill="none" stroke={GUIDANCE_GOLD} strokeWidth={2} opacity={0.94} />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

export function AcousticHeadstock(props: HeadstockProps) {
  return <HeadstockSvg {...props} guitarType="acoustic" />;
}

export function ElectricHeadstock(props: HeadstockProps) {
  return <HeadstockSvg {...props} guitarType="electric" />;
}
