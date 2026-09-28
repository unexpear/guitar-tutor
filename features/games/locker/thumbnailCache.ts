import type { GuitarDesign } from '../../progression/guitarDesigns';
import { isImportedGuitar, type GuitarModelId } from '../../progression/guitarModels';

// Increment when the mobile renderer/material recipes change. This is expendable
// UI data, never a source of ownership or progression information.
export const THUMBNAIL_STORAGE_KEY = 'standardtune-guitar-thumbnails-v3';
export const THUMBNAIL_CACHE_LIMIT = 500_000;
export type ThumbnailEntries = Record<string, string>;
export function thumbnailKey(modelId: GuitarModelId, design: GuitarDesign): string {
  return JSON.stringify([modelId, isImportedGuitar(modelId) ? null : design]);
}
export function validThumbnail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 60_000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value);
}
export function boundedThumbnails(entries: ThumbnailEntries): ThumbnailEntries {
  const result: ThumbnailEntries = {};
  let size = 2;
  for (const [key, uri] of Object.entries(entries).reverse()) {
    if (key.length > 4096 || !validThumbnail(uri)) continue;
    const cost = JSON.stringify({ [key]: uri }).length + 1;
    if (size + cost > THUMBNAIL_CACHE_LIMIT || Object.keys(result).length >= 48) break;
    result[key] = uri;
    size += cost;
  }
  return Object.fromEntries(Object.entries(result).reverse());
}
export function readThumbnailCache(raw: string | null): ThumbnailEntries {
  if (!raw || raw.length > THUMBNAIL_CACHE_LIMIT) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return boundedThumbnails(parsed as ThumbnailEntries);
  } catch { return {}; }
}
