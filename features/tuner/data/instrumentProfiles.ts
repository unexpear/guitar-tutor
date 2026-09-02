import type { TunerConfig } from 'react-native-tuner-engine';

export type InstrumentFamily = 'guitar' | 'bass' | 'ukulele' | 'chromatic';

export type InstrumentId =
  | 'guitar-acoustic'
  | 'guitar-electric'
  | 'guitar-classical'
  | 'guitar-baritone'
  | 'guitar-7'
  | 'guitar-8'
  | 'guitar-12'
  | 'bass-4'
  | 'bass-5'
  | 'bass-6'
  | 'ukulele-standard'
  | 'ukulele-baritone'
  | 'chromatic';

export interface InstrumentProfile {
  id: InstrumentId;
  family: InstrumentFamily;
  name: string;
  shortName: string;
  icon: string;
  /** Visual used by the existing six-string guitar headstock. */
  headstock?: 'acoustic' | 'electric';
  /** Tunings that depend strongly on device bass response are labelled honestly. */
  experimental?: boolean;
  engine: TunerConfig;
}

const COMMON_ENGINE = {
  a4: 440,
  confidenceThreshold: 0.75,
  noiseGateDb: -55,
  onsetDetection: true,
  emaAlpha: 0.42,
  hysteresisFrames: 2,
} as const;

/**
 * Explicit ranges are intentional. Passing `instrument` to the dependency's
 * hook would apply its preset after configure() and overwrite these bounds.
 * String matching is done in this app, so that native side effect is not
 * needed. A larger frame gives the low profiles enough periods to resolve.
 */
export const INSTRUMENT_PROFILES: readonly InstrumentProfile[] = [
  {
    id: 'guitar-acoustic',
    family: 'guitar',
    name: 'Acoustic Guitar',
    shortName: 'Acoustic',
    icon: '🎸',
    headstock: 'acoustic',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 55,
      maxFrequency: 1400,
      hpfCutoffHz: 40,
      quality: 'balanced',
    },
  },
  {
    id: 'guitar-electric',
    family: 'guitar',
    name: 'Electric Guitar',
    shortName: 'Electric',
    icon: '🎸',
    headstock: 'electric',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 55,
      maxFrequency: 1400,
      hpfCutoffHz: 40,
      quality: 'balanced',
    },
  },
  {
    id: 'guitar-classical',
    family: 'guitar',
    name: 'Classical Guitar',
    shortName: 'Classical',
    icon: '🎸',
    headstock: 'acoustic',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 55,
      maxFrequency: 1400,
      hpfCutoffHz: 40,
      quality: 'balanced',
    },
  },
  {
    id: 'guitar-baritone',
    family: 'guitar',
    name: 'Baritone Guitar',
    shortName: 'Baritone',
    icon: '🎸',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 50,
      maxFrequency: 1000,
      hpfCutoffHz: 35,
      quality: 'high-accuracy',
    },
  },
  {
    id: 'guitar-7',
    family: 'guitar',
    name: '7-String Guitar',
    shortName: '7-String',
    icon: '🎸',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 50,
      maxFrequency: 1400,
      hpfCutoffHz: 35,
      quality: 'high-accuracy',
    },
  },
  {
    id: 'guitar-8',
    family: 'guitar',
    name: '8-String Guitar',
    shortName: '8-String',
    icon: '🎸',
    experimental: true,
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 40,
      maxFrequency: 1400,
      hpfCutoffHz: 28,
      quality: 'high-accuracy',
    },
  },
  {
    id: 'guitar-12',
    family: 'guitar',
    name: '12-String Guitar',
    shortName: '12-String',
    icon: '🎸',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 55,
      maxFrequency: 1400,
      hpfCutoffHz: 40,
      quality: 'balanced',
    },
  },
  {
    id: 'bass-4',
    family: 'bass',
    name: '4-String Bass',
    shortName: 'Bass 4',
    icon: '🎸',
    experimental: true,
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 34,
      maxFrequency: 500,
      hpfCutoffHz: 25,
      quality: 'high-accuracy',
    },
  },
  {
    id: 'bass-5',
    family: 'bass',
    name: '5-String Bass',
    shortName: 'Bass 5',
    icon: '🎸',
    experimental: true,
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 27,
      maxFrequency: 500,
      hpfCutoffHz: 20,
      quality: 'high-accuracy',
    },
  },
  {
    id: 'bass-6',
    family: 'bass',
    name: '6-String Bass',
    shortName: 'Bass 6',
    icon: '🎸',
    experimental: true,
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 27,
      maxFrequency: 600,
      hpfCutoffHz: 20,
      quality: 'high-accuracy',
    },
  },
  {
    id: 'ukulele-standard',
    family: 'ukulele',
    name: 'Ukulele',
    shortName: 'Ukulele',
    icon: '♬',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 190,
      maxFrequency: 1000,
      hpfCutoffHz: 100,
      quality: 'balanced',
    },
  },
  {
    id: 'ukulele-baritone',
    family: 'ukulele',
    name: 'Baritone Ukulele',
    shortName: 'Baritone Uke',
    icon: '♬',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 120,
      maxFrequency: 1000,
      hpfCutoffHz: 80,
      quality: 'balanced',
    },
  },
  {
    id: 'chromatic',
    family: 'chromatic',
    name: 'Chromatic',
    shortName: 'Chromatic',
    icon: '♪',
    engine: {
      ...COMMON_ENGINE,
      minFrequency: 34,
      maxFrequency: 1800,
      hpfCutoffHz: 25,
      quality: 'high-accuracy',
    },
  },
];

export function instrumentProfile(id: InstrumentId): InstrumentProfile {
  const profile = INSTRUMENT_PROFILES.find((item) => item.id === id);
  if (!profile) throw new Error(`Unknown tuner instrument: ${id}`);
  return profile;
}

/**
 * Live lesson/game matching needs more raw frames than the visual tuner, whose
 * UI can simply withhold a weak reading. Keep the proven practice thresholds,
 * but do not pass the dependency's `instrument` preset: it would overwrite the
 * explicit low-note range after configuration.
 */
export function guitarPracticeEngineOptions(referencePitchHz = 440): TunerConfig {
  return {
    ...instrumentProfile('guitar-acoustic').engine,
    a4: referencePitchHz,
    confidenceThreshold: 0.5,
    noiseGateDb: -52,
  };
}
