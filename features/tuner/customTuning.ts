import type { InstrumentId } from './data/instrumentProfiles';
import { INSTRUMENT_PROFILES, instrumentProfile } from './data/instrumentProfiles';
import { noteToFrequency, type TuningPreset } from './data/tunings';

export const MAX_CUSTOM_TUNINGS = 50;
export const MAX_TUNING_STRINGS = 12;

export interface CustomTuningInput {
  name: string;
  instrumentId: InstrumentId;
  strings: string[];
}

export function normalizeNote(note: string): string | null {
  const match = note.trim().match(/^([A-Ga-g])([#b]?)([0-8])$/);
  if (!match) return null;
  const normalized = `${match[1].toUpperCase()}${match[2]}${match[3]}`;
  return noteToFrequency(normalized) > 0 ? normalized : null;
}

export function validateCustomTuning(input: CustomTuningInput): string | null {
  const name = input.name.trim();
  if (!name) return 'Enter a tuning name.';
  if (name.length > 40) return 'Keep the name to 40 characters or fewer.';
  if (!INSTRUMENT_PROFILES.some((profile) => profile.id === input.instrumentId)) {
    return 'Choose a supported instrument.';
  }
  if (input.strings.length < 1 || input.strings.length > MAX_TUNING_STRINGS) {
    return `Use between 1 and ${MAX_TUNING_STRINGS} strings.`;
  }
  if (input.strings.some((note) => normalizeNote(note) === null)) {
    return 'Every string needs a note and octave, such as E2 or F#3.';
  }
  const profile = instrumentProfile(input.instrumentId);
  const outsideRange = input.strings.find((note) => {
    const frequency = noteToFrequency(normalizeNote(note)!);
    return frequency < (profile.engine.minFrequency ?? 0) || frequency > (profile.engine.maxFrequency ?? Infinity);
  });
  if (outsideRange) return `${normalizeNote(outsideRange)} is outside the reliable range for ${profile.name}.`;
  return null;
}

export function createCustomTuning(
  input: CustomTuningInput,
  id = `custom-${Date.now().toString(36)}`,
): TuningPreset {
  const error = validateCustomTuning(input);
  if (error) throw new Error(error);
  return {
    id,
    name: input.name.trim(),
    instrumentId: input.instrumentId,
    strings: input.strings.map((note) => normalizeNote(note)!),
  };
}

export function exportCustomTunings(tunings: TuningPreset[]): string {
  return JSON.stringify({ format: 'standardtune-custom-tunings', version: 1, tunings }, null, 2);
}

export function importCustomTunings(text: string): TuningPreset[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The clipboard does not contain valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid tuning backup.');
  const candidate = parsed as { format?: unknown; version?: unknown; tunings?: unknown };
  if (candidate.format !== 'standardtune-custom-tunings' || candidate.version !== 1) {
    throw new Error('This is not a StandardTune tuning backup.');
  }
  if (!Array.isArray(candidate.tunings) || candidate.tunings.length > MAX_CUSTOM_TUNINGS) {
    throw new Error(`A backup may contain at most ${MAX_CUSTOM_TUNINGS} tunings.`);
  }
  return candidate.tunings.map((raw, index) => {
    if (!raw || typeof raw !== 'object') throw new Error(`Tuning ${index + 1} is invalid.`);
    const item = raw as Record<string, unknown>;
    if (typeof item.name !== 'string' || typeof item.instrumentId !== 'string' || !Array.isArray(item.strings)) {
      throw new Error(`Tuning ${index + 1} is missing required fields.`);
    }
    const strings = item.strings.filter((note): note is string => typeof note === 'string');
    if (strings.length !== item.strings.length) throw new Error(`Tuning ${index + 1} has an invalid note.`);
    return createCustomTuning(
      { name: item.name, instrumentId: item.instrumentId as InstrumentId, strings },
      `custom-import-${Date.now().toString(36)}-${index}`,
    );
  });
}
