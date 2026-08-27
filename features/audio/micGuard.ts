/**
 * The decision logic behind useMicReleaseOnLeave, as a pure, injectable guard.
 *
 * A tab screen stays mounted when you switch tabs, and everything that
 * listens — the tuner, the play-along drills, Chord Changes — lives inside a
 * tab. The guard exists so "should we call stop() now?" is a testable rule,
 * not something buried in two effect closures.
 *
 * `isRunning` is captured at creation, mirroring React's effect-closure
 * semantics: the hook recreates the guard (via useMemo keyed on
 * [stop, isRunning]) whenever either changes, exactly as the effects it
 * replaced did. stop() is only called when something is actually running, so
 * an idle or already-released screen is never fought.
 */

export interface MicReleaseGuard {
  /** The focus-effect cleanup: the screen lost focus / is leaving. */
  onBlur(): void;
  /** An app-state transition; anything but 'active' loses the mic. */
  onAppStateChange(state: string): void;
}

export function createMicReleaseGuard(stop: () => void, isRunning: boolean): MicReleaseGuard {
  return {
    onBlur(): void {
      if (isRunning) void stop();
    },
    onAppStateChange(state: string): void {
      if (state !== 'active' && isRunning) void stop();
    },
  };
}