import type { GuitarModelId } from './guitarModels';

export type GuitarFinishFamily = 'wood' | 'metallic' | 'crystal';

export const FULL_GUITAR_MODEL_ASSETS: Record<GuitarModelId, Record<GuitarFinishFamily, number>> = {
  'acoustic-grand': {
    wood: require('../../assets/guitars/acoustic-wood.png'),
    metallic: require('../../assets/guitars/acoustic-metallic.png'),
    crystal: require('../../assets/guitars/acoustic-crystal.png'),
  },
  'acoustic-cutaway': {
    wood: require('../../assets/guitars/acoustic-cutaway-wood.png'),
    metallic: require('../../assets/guitars/acoustic-cutaway-metallic.png'),
    crystal: require('../../assets/guitars/acoustic-cutaway-crystal.png'),
  },
  'electric-doublecut': {
    wood: require('../../assets/guitars/electric-wood.png'),
    metallic: require('../../assets/guitars/electric-metallic.png'),
    crystal: require('../../assets/guitars/electric-crystal.png'),
  },
  'electric-singlecut': {
    wood: require('../../assets/guitars/electric-singlecut-wood.png'),
    metallic: require('../../assets/guitars/electric-singlecut-metallic.png'),
    crystal: require('../../assets/guitars/electric-singlecut-crystal.png'),
  },
};

export const FULL_GUITAR_PLAYER_SKINS: Record<GuitarModelId, Readonly<Record<string, number>>> = {
  'acoustic-grand': {
    'starter-1': require('../../assets/guitars/player-skins/acoustic-grand--starter-1.png'),
    'starter-3': require('../../assets/guitars/player-skins/acoustic-grand--starter-3.png'),
    'starter-5': require('../../assets/guitars/player-skins/acoustic-grand--starter-5.png'),
    'starter-7': require('../../assets/guitars/player-skins/acoustic-grand--starter-7.png'),
    'starter-9': require('../../assets/guitars/player-skins/acoustic-grand--starter-9.png'),
    'level-1': require('../../assets/guitars/player-skins/acoustic-grand--level-1.png'),
    'level-3': require('../../assets/guitars/player-skins/acoustic-grand--level-3.png'),
    'level-5': require('../../assets/guitars/player-skins/acoustic-grand--level-5.png'),
    'level-7': require('../../assets/guitars/player-skins/acoustic-grand--level-7.png'),
    'level-9': require('../../assets/guitars/player-skins/acoustic-grand--level-9.png'),
  },
  'acoustic-cutaway': {
    'starter-1': require('../../assets/guitars/player-skins/acoustic-cutaway--starter-1.png'),
    'starter-3': require('../../assets/guitars/player-skins/acoustic-cutaway--starter-3.png'),
    'starter-5': require('../../assets/guitars/player-skins/acoustic-cutaway--starter-5.png'),
    'starter-7': require('../../assets/guitars/player-skins/acoustic-cutaway--starter-7.png'),
    'starter-9': require('../../assets/guitars/player-skins/acoustic-cutaway--starter-9.png'),
    'level-1': require('../../assets/guitars/player-skins/acoustic-cutaway--level-1.png'),
    'level-3': require('../../assets/guitars/player-skins/acoustic-cutaway--level-3.png'),
    'level-5': require('../../assets/guitars/player-skins/acoustic-cutaway--level-5.png'),
    'level-7': require('../../assets/guitars/player-skins/acoustic-cutaway--level-7.png'),
    'level-9': require('../../assets/guitars/player-skins/acoustic-cutaway--level-9.png'),
  },
  'electric-doublecut': {
    'starter-2': require('../../assets/guitars/player-skins/electric-doublecut--starter-2.png'),
    'starter-4': require('../../assets/guitars/player-skins/electric-doublecut--starter-4.png'),
    'starter-6': require('../../assets/guitars/player-skins/electric-doublecut--starter-6.png'),
    'starter-8': require('../../assets/guitars/player-skins/electric-doublecut--starter-8.png'),
    'starter-10': require('../../assets/guitars/player-skins/electric-doublecut--starter-10.png'),
    'level-2': require('../../assets/guitars/player-skins/electric-doublecut--level-2.png'),
    'level-4': require('../../assets/guitars/player-skins/electric-doublecut--level-4.png'),
    'level-6': require('../../assets/guitars/player-skins/electric-doublecut--level-6.png'),
    'level-8': require('../../assets/guitars/player-skins/electric-doublecut--level-8.png'),
    'level-10': require('../../assets/guitars/player-skins/electric-doublecut--level-10.png'),
  },
  'electric-singlecut': {
    'starter-2': require('../../assets/guitars/player-skins/electric-singlecut--starter-2.png'),
    'starter-4': require('../../assets/guitars/player-skins/electric-singlecut--starter-4.png'),
    'starter-6': require('../../assets/guitars/player-skins/electric-singlecut--starter-6.png'),
    'starter-8': require('../../assets/guitars/player-skins/electric-singlecut--starter-8.png'),
    'starter-10': require('../../assets/guitars/player-skins/electric-singlecut--starter-10.png'),
    'level-2': require('../../assets/guitars/player-skins/electric-singlecut--level-2.png'),
    'level-4': require('../../assets/guitars/player-skins/electric-singlecut--level-4.png'),
    'level-6': require('../../assets/guitars/player-skins/electric-singlecut--level-6.png'),
    'level-8': require('../../assets/guitars/player-skins/electric-singlecut--level-8.png'),
    'level-10': require('../../assets/guitars/player-skins/electric-singlecut--level-10.png'),
  },
};

export const HEADSTOCK_MODEL_ASSETS: Record<GuitarModelId, Record<GuitarFinishFamily, number>> = {
  'acoustic-grand': {
    wood: require('../../assets/guitars/headstock-acoustic-wood.png'),
    metallic: require('../../assets/guitars/headstock-acoustic-metallic.png'),
    crystal: require('../../assets/guitars/headstock-acoustic-crystal.png'),
  },
  'acoustic-cutaway': {
    wood: require('../../assets/guitars/headstock-acoustic-cutaway-wood.png'),
    metallic: require('../../assets/guitars/headstock-acoustic-cutaway-metallic.png'),
    crystal: require('../../assets/guitars/headstock-acoustic-cutaway-crystal.png'),
  },
  'electric-doublecut': {
    wood: require('../../assets/guitars/headstock-electric-wood.png'),
    metallic: require('../../assets/guitars/headstock-electric-metallic.png'),
    crystal: require('../../assets/guitars/headstock-electric-crystal.png'),
  },
  'electric-singlecut': {
    wood: require('../../assets/guitars/headstock-electric-singlecut-wood.png'),
    metallic: require('../../assets/guitars/headstock-electric-singlecut-metallic.png'),
    crystal: require('../../assets/guitars/headstock-electric-singlecut-crystal.png'),
  },
};
