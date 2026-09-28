/** Keep idle readings separate from an actual microphone measurement. */
export function signalHelp({ active, starting, error, signal }: {
  active: boolean; starting: boolean; error?: string; signal: string;
}): { title: string; advice: string } {
  if (error) return { title: 'Microphone unavailable', advice: `${error} Check microphone permission in your device settings, then try again.` };
  if (starting) return { title: 'Starting the microphone…', advice: 'Allow microphone access if your phone asks. Then pluck one string.' };
  if (!active) return { title: 'The tuner is stopped', advice: 'Tap Start tuning to turn on the microphone. No sound is being measured yet.' };
  if (signal === 'clear') return { title: 'Your signal is clear', advice: 'Keep plucking one string at a time. Select a string for guided tuning.' };
  if (signal === 'quiet') return { title: 'The sound is too quiet', advice: 'Pluck a string near the phone and uncover its microphone. For a soft instrument, try Quiet room sensitivity in Settings.' };
  if (signal === 'noisy') return { title: 'Background sound is interfering', advice: 'Mute the other strings and move away from fans or speech. Noisy room sensitivity in Settings can help.' };
  return { title: 'Waiting for a steady note', advice: 'Pluck one string once and let it ring. Mute the others, keep the microphone clear, and select the string you want to tune.' };
}
