export type GuitarType = 'acoustic' | 'electric';

export type GuitarModelId =
  | 'acoustic-grand'
  | 'acoustic-cutaway'
  | 'electric-doublecut'
  | 'electric-singlecut';

export interface GuitarModel {
  id: GuitarModelId;
  name: string;
  guitarType: GuitarType;
  description: string;
}

export const GUITAR_MODELS: readonly GuitarModel[] = [
  {
    id: 'acoustic-grand',
    name: 'Grand Acoustic',
    guitarType: 'acoustic',
    description: 'A full, balanced traditional body.',
  },
  {
    id: 'acoustic-cutaway',
    name: 'Concert Cutaway',
    guitarType: 'acoustic',
    description: 'A slimmer body with easier upper-fret reach.',
  },
  {
    id: 'electric-doublecut',
    name: 'Modern Double-Cut',
    guitarType: 'electric',
    description: 'A light, symmetrical modern electric.',
  },
  {
    id: 'electric-singlecut',
    name: 'Carved Single-Cut',
    guitarType: 'electric',
    description: 'A rounded carved body with a solid feel.',
  },
];

export const DEFAULT_GUITAR_MODEL_IDS: Record<GuitarType, GuitarModelId> = {
  acoustic: 'acoustic-grand',
  electric: 'electric-doublecut',
};

export function guitarModel(id: string): GuitarModel | undefined {
  return GUITAR_MODELS.find((model) => model.id === id);
}

export function guitarModelsForType(guitarType: GuitarType): readonly GuitarModel[] {
  return GUITAR_MODELS.filter((model) => model.guitarType === guitarType);
}

export function selectedModelId(
  selected: Partial<Record<GuitarType, string>> | undefined,
  guitarType: GuitarType,
): GuitarModelId {
  const candidate = selected?.[guitarType];
  const model = candidate ? guitarModel(candidate) : undefined;
  return model?.guitarType === guitarType ? model.id : DEFAULT_GUITAR_MODEL_IDS[guitarType];
}
