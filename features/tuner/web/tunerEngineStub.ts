export function useTuner(_options?: unknown) {
  return {
    start: async () => {},
    stop: async () => {},
    latest: null,
    isRunning: false,
    error: { message: 'Tuner engine is native-only' } as Error | null,
  };
}

export type TunerConfig = Record<string, unknown>;
