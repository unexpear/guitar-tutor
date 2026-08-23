import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Release the microphone when the user leaves the screen or backgrounds the
 * app.
 *
 * Tab screens stay mounted when you switch tabs, and everything that listens
 * here — the tuner, the play-along drills, Chord Changes — lives inside a
 * tab. Without this, starting the tuner and then wandering off to the Chords
 * tab left the mic open indefinitely: a battery drain, and squarely against
 * the promise that this app only listens while you are asking it to.
 *
 * `stop` is called only when something is actually running, so this never
 * fights a screen that is already idle.
 */
export function useMicReleaseOnLeave(stop: () => void, isRunning: boolean) {
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isRunning) void stop();
      };
    }, [stop, isRunning])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && isRunning) void stop();
    });
    return () => sub.remove();
  }, [stop, isRunning]);
}
