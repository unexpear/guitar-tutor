import { useCallback, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createMicReleaseGuard } from './micGuard';

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
 * All of the decision logic lives in createMicReleaseGuard; this hook only
 * wires it to the two exits a screen has (losing focus, losing the
 * foreground). The guard is keyed on [stop, isRunning], so a guard created
 * while the tuner ran faithfully releases later (stale-closure parity), and
 * one created after it stopped stays silent.
 */
export function useMicReleaseOnLeave(stop: () => void, isRunning: boolean) {
  const guard = useMemo(
    () => createMicReleaseGuard(stop, isRunning),
    [stop, isRunning],
  );

  useFocusEffect(
    useCallback(() => {
      return () => guard.onBlur();
    }, [guard])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      guard.onAppStateChange(state);
    });
    return () => sub.remove();
  }, [guard]);
}