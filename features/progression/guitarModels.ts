export type GuitarType = 'acoustic' | 'electric';

export type LegacyGuitarModelId =
  | 'acoustic-grand'
  | 'acoustic-cutaway'
  | 'electric-doublecut'
  | 'electric-singlecut';
export type ImportedGuitarModelId = 'acoustic-classical' | 'electric-cotton-candy';
export type GuitarModelId = LegacyGuitarModelId | ImportedGuitarModelId;
export function isImportedGuitar(id: string): id is ImportedGuitarModelId {
  return id === 'acoustic-classical' || id === 'electric-cotton-candy';
}

export interface GuitarModel {
  id: GuitarModelId;
  name: string;
  guitarType: GuitarType;
  description: string;
}

export const GUITAR_MODELS: readonly GuitarModel[] = [
  {id:'acoustic-classical',name:'Classical',guitarType:'acoustic',description:'Detailed classical guitar. Fixed wood finish · device testing preview.'},
  {id:'electric-cotton-candy',name:'Cotton Candy',guitarType:'electric',description:'Detailed electric guitar. Fixed iridescent cyan finish · device testing preview.'},
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

export const DEFAULT_GUITAR_MODEL_IDS: Record<GuitarType, LegacyGuitarModelId> = {
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
