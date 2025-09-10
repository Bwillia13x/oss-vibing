'use server';

import { routePromptToTask, taskToPlan, Task } from '@/lib/tasks/router';
import { runChart } from '@/lib/pipelines/chart';
import { runDcf, sanityCheckInputs } from '@/lib/pipelines/dcf';
import { makeSandboxRunner } from '@/lib/sandbox';
import { makeMetrics } from '@/lib/observability/metrics';
import { writeRunManifest } from '@/lib/observability/manifest';
import { PolygonPriceAdapter } from '@/lib/finance/providers/polygon';

export async function planTask(prompt: string): Promise<{ task: Task; plan: { steps:string[]; inputs:Record<string,any> } }> {
  const task = routePromptToTask(prompt);
  const plan = taskToPlan(task);
  return { task, plan };
}

export async function executeTask(task: Task): Promise<{
  kind: Task['kind'];
  previewUrl?: string;
  artifacts?: string[];
  citations?: string[];
  sandboxId?: string;
  command?: { cmdId: string; command: string; args: string[] };
  cost: number;
  tokens: number;
  latencyMs: number;
  message?: string;
  result?: any;
}> {
  const metrics = makeMetrics();
  metrics.label('taskKind', task.kind);

  switch (task.kind) {
    case 'chart': {
      const priceAdapter = new PolygonPriceAdapter();
      const sandbox = makeSandboxRunner();
      const result = await runChart(task, { price: priceAdapter, sandbox, metrics });
      const metricRecord = metrics.stop();
      const out = {
        kind: 'chart',
        previewUrl: result.previewUrl,
        artifacts: result.artifacts,
        citations: result.citations,
        sandboxId: result.sandboxId,
        command: result.command,
        // Optionally surface logs in UI via existing commands-logs components
        cost: metricRecord.cost,
        tokens: metricRecord.tokens,
        latencyMs: metricRecord.latencyMs
      } as const
      try {
        const manifestPath = await writeRunManifest({
          id: `chart-${Date.now()}`,
          kind: 'chart',
          inputs: { task },
          previewUrl: out.previewUrl,
          artifacts: out.artifacts,
          citations: out.citations,
          metrics: {
            model: metricRecord.model,
            tokens: out.tokens,
            cost: out.cost,
            latencyMs: out.latencyMs,
            cacheHit: metricRecord.cacheHit,
          },
          startedAt: new Date(Date.now() - out.latencyMs).toISOString(),
          finishedAt: new Date().toISOString(),
        })
        return { ...out, artifacts: [...(out.artifacts ?? []), manifestPath] }
      } catch {}
      return out;
    }
    case 'dcf': {
      const sanity = sanityCheckInputs(task);
      if (!sanity.ok) {
        // Continue, but include warnings in message
      }
      const result = await runDcf(task, { metrics });
      const metricRecord = metrics.stop();
      const out = {
        kind: 'dcf',
        artifacts: result.files,
        message: [
          sanity.warnings.length ? `Warnings: ${sanity.warnings.join(' ')}` : undefined,
          result.explain,
        ]
          .filter(Boolean)
          .join('\n'),
        result,
        cost: metricRecord.cost,
        tokens: metricRecord.tokens,
        latencyMs: metricRecord.latencyMs,
      } as const
      try {
        const manifestPath = await writeRunManifest({
          id: `dcf-${Date.now()}`,
          kind: 'dcf',
          inputs: { task },
          artifacts: out.artifacts,
          metrics: {
            model: metricRecord.model,
            tokens: out.tokens,
            cost: out.cost,
            latencyMs: out.latencyMs,
            cacheHit: metricRecord.cacheHit,
          },
          startedAt: new Date(Date.now() - out.latencyMs).toISOString(),
          finishedAt: new Date().toISOString(),
        })
        return { ...out, artifacts: [...(out.artifacts ?? []), manifestPath] }
      } catch {}
      return out;
    }
    case 'filingQA':
      return {
        kind: 'filingQA',
        message: 'Filing QA not implemented yet',
        cost: 0,
        tokens: 0,
        latencyMs: 0
      };
  }
}
