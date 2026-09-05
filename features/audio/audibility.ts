export function isReferenceAudible(settings: { soundsEnabled: boolean; sampleVolume: number }): boolean {
  return settings.soundsEnabled && Number.isFinite(settings.sampleVolume) && settings.sampleVolume > 0;
}

/** Preserve an audible chosen volume; restore a moderate level only from silence. */
export function trainingAudioSettings(settings: { sampleVolume: number }) {
  return { soundsEnabled:true, sampleVolume:settings.sampleVolume > 0 ? settings.sampleVolume : 50 };
}
