import type { ViewStyle } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#fff',
    cardBorder: '#e5e5e5',
    muted: '#6b7280',
    surface: '#f5f5f5',
    surfaceElevated: '#ffffff',
    textOnTint: '#ffffff',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0f0f23',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1a1a2e',
    cardBorder: '#2a2a4a',
    muted: '#b3b8c7',
    surface: '#1a1a2e',
    surfaceElevated: '#252545',
    textOnTint: '#ffffff',
  },
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  spacing: {
    xs: 4,
    sm: 8,
    gap: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
  },
};

export const CARD_SHADOW: ViewStyle = {
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
  elevation: 4,
};

