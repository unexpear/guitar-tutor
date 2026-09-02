export type GuitarDesignRarity = 'Starter' | 'Rare' | 'Epic' | 'Legendary';

export interface GuitarDesign {
  id: string;
  name: string;
  guitarType: 'acoustic' | 'electric';
  unlockLevel: number;
  rarity: GuitarDesignRarity;
  faceTop: string;
  faceMid: string;
  faceBottom: string;
  rim: string;
  grain: string | null;
  fretboardTop: string;
  fretboardBottom: string;
  nut: string;
  string: string;
}

type Palette = readonly [string, string, string, string];

const STARTER: readonly [string, Palette][] = [
  ['Warm Mahogany', ['#A66A3F', '#7D4727', '#442514', '#D6A16A']],
  ['Midnight', ['#4B4D62', '#292B3B', '#11121C', '#9498B8']],
  ['Cherry Pop', ['#E85D6A', '#9E293B', '#4B1220', '#FF9AA5']],
  ['Ocean Blue', ['#4C91D9', '#235B9A', '#10294E', '#8DC5FF']],
  ['Forest', ['#5D9B68', '#30633B', '#17341F', '#9FD5A7']],
  ['Honey Gold', ['#E2AD4F', '#A66A1E', '#57340F', '#FFE080']],
  ['Plum Jam', ['#9A68B5', '#5D3475', '#2B1639', '#D7A7EF']],
  ['Storm Slate', ['#78889B', '#435064', '#202735', '#BAC8D8']],
  ['Vintage Cream', ['#F1D9AE', '#C59C66', '#6D4B29', '#FFF0CF']],
  ['Sunset Burst', ['#F28A43', '#B43A3A', '#46182D', '#FFD092']],
];

const LOCKED: readonly [string, Palette][] = [
  ['Arctic Mint', ['#A8F0DD', '#45A991', '#164C46', '#D8FFF5']],
  ['Hot Rod', ['#FF765F', '#D32F2F', '#5B1111', '#FFC0B5']],
  ['Royal Violet', ['#B995FF', '#6541B6', '#2A165E', '#E4D4FF']],
  ['Surf Foam', ['#D8F2E3', '#78BFA0', '#285B4C', '#FFFFFF']],
  ['Copper Wire', ['#DC9060', '#99502D', '#3D1C10', '#FFD0AA']],
  ['Night Sky', ['#4656A5', '#202B6C', '#0A1033', '#92A4FF']],
  ['Lemon Drop', ['#FFE169', '#D39B16', '#614409', '#FFF5B5']],
  ['Rose Quartz', ['#F6B1C3', '#BD607E', '#542438', '#FFE3EB']],
  ['Lagoon', ['#43D8CF', '#127E87', '#07363D', '#A1FFF7']],
  ['Black Cherry', ['#8E334E', '#491529', '#170811', '#DC7895']],
  ['Neon Lime', ['#B8FF55', '#58B91F', '#173C08', '#E4FFA8']],
  ['Synthwave', ['#FF61D8', '#7B36D4', '#21105A', '#55E7FF']],
  ['Ice Crystal', ['#E6F8FF', '#83BED7', '#2B506A', '#FFFFFF']],
  ['Dragon Scale', ['#6BCB72', '#176B45', '#082D28', '#DBB85A']],
  ['Molten Core', ['#FFB347', '#E34224', '#55120D', '#FFF08A']],
  ['Blue Flame', ['#70E6FF', '#2775DF', '#14206B', '#E2FAFF']],
  ['Amethyst', ['#D49BFF', '#793CB5', '#2E124F', '#F3D7FF']],
  ['Aurora', ['#81F3D1', '#5578E8', '#32206E', '#FF8EDB']],
  ['Crimson Crown', ['#FF6C72', '#A10D32', '#350515', '#FFD36A']],
  ['Solar Gold', ['#FFF09A', '#D99C22', '#694008', '#FFFFFF']],
  ['Nebula', ['#E273FF', '#5535B8', '#120D46', '#65E6FF']],
  ['Emerald Crown', ['#65E6A4', '#12805B', '#06352A', '#FFE07A']],
  ['Plasma', ['#FF70EC', '#815CFF', '#271357', '#73F5FF']],
  ['Phoenix', ['#FFE36E', '#F05A28', '#5B1010', '#FFF6C5']],
  ['Moonstone', ['#F4F5FF', '#909ACB', '#343958', '#FFFFFF']],
  ['Void Glass', ['#4C5378', '#171B31', '#05060E', '#B0B8FF']],
  ['Prismatic', ['#FF86B7', '#6C70EE', '#154F68', '#8CFFD8']],
  ['Starlight', ['#DFF8FF', '#5B8DFF', '#171D58', '#FFF6A8']],
  ['Mythic Ember', ['#FFF0A1', '#D52B36', '#3A0718', '#73E6FF']],
  ['Cosmic Legend', ['#F5C2FF', '#6657E8', '#100A42', '#7DFFF2']],
];

function buildDesign(
  item: readonly [string, Palette],
  index: number,
  starter: boolean,
): GuitarDesign {
  const [name, [top, mid, bottom, accent]] = item;
  const rarity: GuitarDesignRarity = starter
    ? 'Starter'
    : index < 10
      ? 'Rare'
      : index < 20
        ? 'Epic'
        : 'Legendary';
  return {
    id: `${starter ? 'starter' : 'level'}-${index + 1}`,
    name,
    guitarType: index % 2 === 0 ? 'acoustic' : 'electric',
    unlockLevel: starter ? 1 : index + 2,
    rarity,
    faceTop: top,
    faceMid: mid,
    faceBottom: bottom,
    rim: accent,
    grain: starter || index < 10 ? bottom : accent,
    fretboardTop: index >= 20 ? mid : '#2A2430',
    fretboardBottom: index >= 20 ? bottom : '#121018',
    nut: index >= 20 ? accent : '#ECE7DB',
    string: index >= 10 ? accent : '#D8D8DE',
  };
}

export const GUITAR_DESIGNS: readonly GuitarDesign[] = [
  ...STARTER.map((item, index) => buildDesign(item, index, true)),
  ...LOCKED.map((item, index) => buildDesign(item, index, false)),
];

export const DEFAULT_GUITAR_DESIGN_ID = GUITAR_DESIGNS[0].id;

export function guitarDesign(id: string): GuitarDesign {
  return GUITAR_DESIGNS.find((design) => design.id === id) ?? GUITAR_DESIGNS[0];
}

export function isDesignUnlocked(design: GuitarDesign, level: number): boolean {
  return level >= design.unlockLevel;
}
