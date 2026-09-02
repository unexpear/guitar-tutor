import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  scale?: number;
}

export default function PressableScale({
  scale = 0.96,
  children,
  style,
  hitSlop = 4,
  ...props
}: PressableScaleProps) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.base, style, animatedStyle]}
      onPressIn={() => {
        scaleValue.value = withSpring(scale, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scaleValue.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      accessibilityRole="button"
      hitSlop={hitSlop}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {},
});
