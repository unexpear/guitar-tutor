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
