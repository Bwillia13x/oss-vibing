export type MetricRecord = { taskKind: string; model: string; tokens: number; cost: number; latencyMs: number; cacheHit: boolean; providerCalls: { name:string; cost:number }[] };

export interface Metrics {
  start(): void;
  stop(): MetricRecord;
  label(k:string,v:string|number): void;
}

export function makeMetrics(): Metrics {
  let startTime: number | null = null;
  const labels: Record<string, string|number> = {};

  return {
    start() {
      startTime = Date.now();
    },
    stop(): MetricRecord {
      const latencyMs = startTime ? Date.now() - startTime : 0;
      return {
        taskKind: labels.taskKind as string || 'unknown',
        model: labels.model as string || 'unknown',
        tokens: labels.tokens as number || 0,
        cost: labels.cost as number || 0,
        latencyMs,
  cacheHit: Boolean(labels.cacheHit),
        providerCalls: []
      };
    },
    label(k: string, v: string|number) {
      labels[k] = v;
    }
  };
}
