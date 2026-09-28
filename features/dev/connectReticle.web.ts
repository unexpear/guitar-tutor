import { useGuitarRewardStore } from '../store/guitarRewardStore';
import { usePracticeToolsStore } from '../store/practiceToolsStore';
import { useProgressStore } from '../store/progressStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTuningStore } from '../store/tuningStore';
import { useUserPreferencesStore } from '../store/userPreferencesStore';

// Reticle instruments Expo web only. Native Android has no supported SDK path.
export function connectReticle() {
  if (!__DEV__) return;
  const token = process.env.EXPO_PUBLIC_RETICLE_TOKEN;
  const projectId = process.env.EXPO_PUBLIC_RETICLE_PROJECT_ID;
  if (!token || !projectId) return;
  void import('@reticlehq/react').then(({ install, registerCapabilities, registerStore, reticle }) => {
    install();
    registerStore('settings', useSettingsStore);
    registerStore('tuning', useTuningStore);
    registerStore('progress', useProgressStore);
    registerStore('rewards', useGuitarRewardStore);
    registerStore('practiceTools', usePracticeToolsStore);
    registerStore('preferences', useUserPreferencesStore);
    registerCapabilities({
      testids: [],
      signals: [],
      stores: ['settings', 'tuning', 'progress', 'rewards', 'practiceTools', 'preferences'],
    });
    reticle.connect({ projectId, token });
  });
}
