# MadLab (NL-First Finance) — Build-Ready Roadmap on Vercel OSS Vibe

> **Repo:** `vercel/examples/apps/vibe-coding-platform`
> **Live Ref:** `oss-vibe-coding-platform.vercel.app`
> **UI Principle:** Preserve the split-pane Vibe layout (Chat • Preview • Remote FS • Output) with ultra-minimal styling.
> **Interaction Model:** Prompt → deterministic task plan → safe execution (Sandbox/worker) → preview/result with citations & cost telemetry.

---

## 1) Executive Summary (NL-first Finance on Vibe)

**Goal.** Ship MadLab MVP that lets analysts express finance tasks in natural language and receive reproducible, cited outputs with low latency and explicit costs.

**MVP Workflows**

* **Prompt-to-Chart**
  Prices and benchmarks with optional annotations (e.g., drawdowns). Output: time-series chart in Preview, data table in Remote FS, citations + cost chip.
* **Prompt-to-DCF/EPV**
  Deterministic valuation from assumptions. Output: assumptions table, scenarios (base/bear/bull), sensitivity grid, CSV/XLSX export, “Explain my model” prose.
* **Ask-the-Filings**
  SEC/SEDAR+ Q\&A over indexed filings with line-level citations and page anchors. Output: quoted spans with links, confidence score, abstain on low confidence.

**Non-Functional Targets**

* **Latency:** `< 3s` on cache hits; `< 12s` cold paths end-to-end.
* **Cost Visibility:** Token/model/provider and data API costs surfaced per run.
* **Safety:** Read-only, egress-restricted code execution; human “Approve & Run” gate.
* **Reproducibility:** Deterministic task plan, captured inputs, versioned data providers.

---

## 2) Architecture Overview

### Text Diagram

```
[Chat Panel]
   └─► routePromptToTask()  ──►  Pipelines (chart|dcf|filingQA)
                                 │
                                 ├─► JS/TS Viz → Vercel Sandbox (no network)
                                 ├─► Python Worker (FastAPI) for analytics
                                 └─► RAG/Index for Filings (server-side)
                                         │
[Data Adapters]  Price | Fundamentals | Filings  (cache, rate-limit, retries)
[Model Layer]    AI Gateway (routing, fallback, spend telemetry)
[Observability]  metrics logger → Cost/Latency chip + Metrics tab
[Security]       FS read-only, egress allowlist, package allow-list, quotas, audit log
[Preview Panel]  render artifacts + Citations + Cost chip + Approve & Run
```

### Key Components

* **Next.js (App Router) + Vercel AI SDK** for chat, tools, server actions.
* **Code Execution Split**

  * **Vercel Sandbox** for generated JS/TS visualization code (no outbound network).
  * **Python Worker (FastAPI)** for pandas/numpy/statsmodels/Monte Carlo; invoked from server actions.
* **Data Layer**

  * `PriceAdapter`, `FundamentalsAdapter`, `FilingAdapter` behind provider implementations.
  * Shared caching (in-memory + KV) and rate-limit wrapper; request collapsing.
* **Model Layer**

  * AI Gateway for model routing/fallback and per-task model selection; provider spend caps.
* **Observability**

  * Per-run metrics: model, tokens, latency, cache hit, API calls; artifact lineage and provenance.
* **Security**

  * Sandbox read-only FS, CPU/mem/time quotas, package allow-list; Python worker egress allowlist; audit trail.

---

## 3) UI/UX Contract (preserve Vibe minimalism)

**Panels retained (unchanged placement):**

* **Chat** (left) — prompt input and streamed assistant plan.
* **Preview** (top-right) — charts/tables/text results.
* **Sandbox Remote Filesystem** (mid-right) — generated assets (.csv/.xlsx/.png/.html).
* **Sandbox Remote Output** (bottom-right) — console/logs.

**Micro-additions (minimal styling):**

* **Task Plan Drawer** (thin collapsible strip under Chat header)

  * Shows parsed task (`kind`, inputs, steps) and requires **Approve & Run**.
* **Citations Panel** (right below Preview result)

  * Compact list of sources with anchors.
* **Cost/Latency Chip** (top-right of Preview)

  * Shows tokens, API \$ estimate, total latency.
* **Approve & Run Gate**

  * Button appears after plan render; must be clicked before pipeline executes.

*No color/theme overhaul. Only subtle spacing and small labels consistent with the existing typography.*

---

## 4) Module & File Plan (drop-in paths)

> Each file lists core signatures and responsibility.

### `/lib/finance/adapters.ts`

```ts
export type PricePoint = { t: string; v: number };
export interface PriceAdapter {
  getPrices(params: { ticker: string; range: '1d'|'1m'|'1y'|'5y'|'10y'; metric?: 'close'|'total_return' }): Promise<PricePoint[]>;
}

export interface FundamentalsAdapter {
  getSnapshot(params: { ticker: string; fields: string[] }): Promise<Record<string, number|string>>;
}

export type FilingHit = { id: string; url: string; title: string; date: string; snippet: string };
export interface FilingAdapter {
  search(params: { ticker?: string; query: string; limit?: number }): Promise<FilingHit[]>;
  fetchText(params: { id: string }): Promise<{ text: string }>;
}
```

*Responsibility:* stable interfaces to decouple pipelines from providers.

### `/lib/finance/providers/polygon.ts` (example provider)

```ts
export class PolygonPriceAdapter implements PriceAdapter {
  constructor(private apiKey = process.env.POLYGON_API_KEY!) {}
  async getPrices({ ticker, range, metric = 'close' }): Promise<PricePoint[]> { /* ... */ }
}
```

*Responsibility:* concrete integrations with env-loaded keys; normalized outputs.

> Mirror file for `alpha.ts` or `yahoo.ts` as alternates/fallbacks.

### `/lib/tasks/router.ts`

```ts
export type ChartTask = { kind:'chart'; tickers: string[]; range: string; metric: 'close'|'total_return'; flags?: { drawdowns?: boolean; annotations?: string[] } };
export type DcfTask   = { kind:'dcf'; ticker: string; horizon: number; wacc?: number; scenarios?: { base: any; bull?: any; bear?: any } };
export type FilingTask= { kind:'filingQA'; ticker?: string; question: string; k?: number };

export type Task = ChartTask | DcfTask | FilingTask;

export function routePromptToTask(prompt: string): Task;
export function taskToPlan(task: Task): { steps: string[]; inputs: Record<string, any> };
```

*Responsibility:* NL → structured Task; Task → human-readable plan for approval.

### `/lib/pipelines/chart.ts`

```ts
import { PriceAdapter } from '../finance/adapters';

export async function runChart(task: ChartTask, deps: { price: PriceAdapter, sandbox: SandboxRunner, metrics: Metrics }): Promise<{ previewUrl: string; artifacts: string[]; citations: string[] }>;
export function computeDrawdowns(series: {t:string; v:number}[]): { start: string; end: string; pct: number }[];
```

*Responsibility:* fetch + normalize data; generate client-safe chart code; emit to Sandbox.

### `/lib/pipelines/dcf.ts`

```ts
export type DcfOutput = {
  assumptions: Record<string, number|string>;
  pvByScenario: Record<'base'|'bull'|'bear', number>;
  sensitivity: Array<{ wacc: number; terminalG: number; value: number }>;
  files: string[]; // paths to CSV/XLSX
  explain: string;
};

export async function runDcf(task: DcfTask, deps: { callWorker: (path:string, body:any)=>Promise<any>, metrics: Metrics }): Promise<DcfOutput>;
export function sanityCheckInputs(task: DcfTask): { ok: boolean; warnings: string[] };
```

*Responsibility:* validate inputs; call Python worker; package outputs.

### `/lib/pipelines/filingQA.ts`

```ts
export type QAHit = { text: string; citation: { url:string; page?: number; section?: string } ; score: number };

export async function ingestFilings(ticker: string, deps: { filings: FilingAdapter }): Promise<{ docCount: number }>;
export async function askFilings(task: FilingTask, deps: { filings: FilingAdapter, embed: (x:string)=>number[], search: (v:number[])=>QAHit[] }): Promise<{ answer: string; hits: QAHit[]; abstained: boolean }>;
```

*Responsibility:* build/consult a small RAG index; return verbatim spans with anchors; abstain under confidence floor.

### `/app/actions/runTask.ts`

```ts
'use server';
import { routePromptToTask, taskToPlan, Task } from '@/lib/tasks/router';

export async function planTask(prompt: string): Promise<{ task: Task; plan: { steps:string[]; inputs:Record<string,any> } }>;
export async function executeTask(task: Task): Promise<{
  kind: Task['kind']; previewUrl?: string; artifacts?: string[]; citations?: string[]; cost: number; tokens: number; latencyMs: number; message?: string; result?: any;
}>;
```

*Responsibility:* server actions to (1) render plan, (2) execute after approval, (3) attach metrics.

### `/lib/sandbox/index.ts`

```ts
export interface SandboxRunner {
  run(code: string, opts?: { cpuMs?: number; memMb?: number; timeoutMs?: number; allowPackages?: string[] }): Promise<{ previewUrl: string; files: string[]; logs: string[] }>;
}
export function makeSandboxRunner(): SandboxRunner;
```

*Responsibility:* thin wrapper over Vercel Sandbox with strict resource limits and package allow-list.

### `/workers/python/main.py` (FastAPI)

```py
from fastapi import FastAPI
from pydantic import BaseModel

class DcfRequest(BaseModel):
    ticker: str
    horizon: int
    wacc: float | None = None
    scenarios: dict | None = None

app = FastAPI()

@app.post("/dcf")
def dcf(req: DcfRequest):
    # compute cash flows, discount, sensitivity grid; return json + optional CSV/XLSX bytes
    return { "assumptions": {...}, "pvByScenario": {...}, "sensitivity": [...], "files": [] }

@app.post("/epv")
def epv(...): ...
@app.post("/montecarlo")
def mc(...): ...
```

*Responsibility:* analytics compute path; returns JSON + optional binary files.

### `/lib/observability/metrics.ts`

```ts
export type MetricRecord = { taskKind: string; model: string; tokens: number; cost: number; latencyMs: number; cacheHit: boolean; providerCalls: { name:string; cost:number }[] };
export interface Metrics { start(): void; stop(): MetricRecord; label(k:string,v:string|number): void }
export function makeMetrics(): Metrics;
```

*Responsibility:* capture per-run cost/latency and provider spend for UI chips and Metrics tab.

### `/components/panels/TaskPlan.tsx`

* Minimal drawer under Chat header; renders `steps` and `inputs` with an **Approve & Run** button.

### `/components/panels/Citations.tsx`

* Compact list showing `[source] · path · page/section`.

### `/components/panels/CostChip.tsx`

* Tiny pill with `tokens · $cost · ms`.

---

## 5) MVP Stories & Acceptance Criteria

### **S-1 Prompt-to-Chart**

* [ ] User prompt: “Plot ENB vs TRP 10y TR incl. dividends; mark drawdowns >20%.”
* [ ] Router emits:

  ```
  { kind:'chart', tickers:['ENB','TRP'], range:'10y', metric:'total_return', flags:{ drawdowns:true } }
  ```

* [ ] Data pulled via `PriceAdapter` → normalized to `{t, v}` with equal calendar alignment.
* [ ] Chart code generated and executed in **Sandbox** with **no outbound network**.
* [ ] Preview shows chart; Citations list the provider/query; CostChip shows tokens/\$/latency.
* [ ] Drawdown regions shaded; tooltip shows peak-to-trough % and dates.
* [ ] CSV of the underlying series saved to Remote FS.

### **S-2 Prompt-to-DCF/EPV**

* [ ] Router builds `{ ticker, horizon, wacc?, scenarios }`.
* [ ] `sanityCheckInputs()` warns on horizon > 10y, WACC out of \[4, 20], negative revenue growth, etc.
* [ ] Server action calls `/dcf`; returns assumptions, PVs, sensitivity grid.
* [ ] Export buttons write `assumptions.csv`, `sensitivity.csv`, `dcf.xlsx` to Remote FS.
* [ ] “Explain my model” prose panel summarizing drivers and sensitivities.
* [ ] All numeric outputs round consistently; units displayed; timebase explicit (FY vs TTM).

### **S-3 Ask-the-Filings**

* [ ] Ingestion builds embeddings for selected filings; metadata includes form type, date, page.
* [ ] `askFilings()` returns answer with **verbatim spans** and `[url#page]` anchors.
* [ ] Confidence < threshold → **abstain** with suggestion to refine query.
* [ ] Citations panel shows each source with compact tags (10-K, year, section).
* [ ] No PII stored; index stored under project namespace.

---

## 6) Data & Entitlements Plan

**First Provider (prices):** Start with one reliable source; expose via `PriceAdapter`.
**Fallbacks:** Implement alternate provider module; exponential backoff + quick failover.
**Rate-limits:** Central wrapper that tracks calls per key; queue with jitter.
**Caching:**

* KV cache for series keyed by `{provider}:{ticker}:{range}:{metric}`.
* TTLs: 1d for 10y ranges; 5m for intraday; manual bust on symbol changes.
  **Request Collapsing:** Debounce identical requests within 200ms window server-side.

**Filings (SEC/SEDAR+):**

* Fetch HTML/XBRL, convert to text, store with `{ticker, form, date, pageMap}` metadata.
* Embedding index per ticker; update cadence weekly; page-level anchors retained.
* Storage footprint noted in Metrics tab.

**Secrets & Keys (Vercel env):**

* `POLYGON_API_KEY`, `ALPHA_VANTAGE_KEY`, `SEDAR_COOKIE` (if applicable), `OPENAI_API_KEY` (or Gateway key).
* Least-privilege: project-scoped, no dev keys in client; use server actions only.

---

## 7) Security & Guardrails

**Sandbox Policy**

* Read-only FS; output confined to `/out/*`.
* `timeoutMs` default 4,000; `memMb` 256; CPU budget guarded.
* `allowPackages`: `'recharts','echarts','d3'` (minimal set).
* No network egress inside Sandbox.

**Python Worker**

* Egress allowlist (prices/providers only if needed).
* Pydantic input validation; 10s timeout; circuit breaker after 3 errors.
* Structured logs; request IDs; redaction of secrets.

**Human-in-the-Loop**

* Always show **Task Plan**; require **Approve & Run**.
* Red “This is not investment advice” footer in Preview.

**Audit**

* Persist plan, inputs, model id, provider calls, costs, and artifacts path per run.

---

## 8) Observability & Cost Control

**Per-Run Metrics**

* Model/provider names, tokens, latency, cache hit, API call counts and dollars.
* Attach metrics to artifacts; render CostChip.

**Budgets**

* Daily token and data-API budgets; soft warnings at 80%; hard stop at 100% with admin override.

**Metrics Tab**

* Simple tables: last 50 runs (task kind, latency, cost, cacheHit).
* Small sparklines for latency and spend.

---

## 9) Testing Strategy

**Unit**

* Adapters: shape normalization; caching keys; retry behavior.
* Pipelines: drawdown math; sensitivity grid correctness; abstain thresholds.

**Golden-File**

* Chart: render deterministic SVG/PNG snapshot for a fixed seed series.

**Property-Based**

* DCF math: invariants on discounting monotonicity; terminal value bounds.

**Contract**

* Provider mocks with recorded responses; schema drift detection.

**Sandbox Smoke**

* Run a minimal chart code; assert no network calls; output files created.

**Load**

* Python `/dcf`: sustain N req/min without timeouts; latency p95 < 8s on cold.

**CI Gates (GitHub Actions)**

* Lint, type-check, test matrix (Node + Python), build; fail on uncovered critical paths.

---

## 10) Phased Plan with Milestones (timeboxes)

**Phase 0 — Fork & Hardening (1–2 days)**

* Clone, install, `vercel link`.
* Wire AI Gateway keys, set envs, add `.env.example`.
* Implement `makeSandboxRunner()` with safe defaults.
* Health check page + status badge.

**Phase 1 — Prompt-to-Chart (2–3 days)**

* Implement `PriceAdapter` + caching + request collapsing.
* `routePromptToTask()` for chart prompts; `runChart()` with drawdown overlay.
* Citations panel + CostChip hooked to metrics.

**Phase 2 — Python Worker + DCF/EPV (3–5 days)**

* FastAPI worker with `/dcf`; Next.js server action client.
* Scenarios + sensitivity grid + CSV/XLSX export.
* Sanity checks and “Explain my model” text.

**Phase 3 — Filings RAG (4–6 days)**

* Ingestion pipeline; embeddings; `askFilings()`.
* Verbatim spans with anchors; abstain path; citations UI.

**Phase 4 — Guardrails/Obs (2–3 days)**

* Approve gate; budgets; Metrics tab; alerts on error spikes.

**Phase 5 — Polish (1–2 days)**

* Empty-states, copy, edge-case handling; docs page.

---

## 11) Risk Register & Mitigations

* **Data coverage gaps** → Multiple adapters + graceful degradation + user notice.
* **Provider quotas** → Caching, request collapsing, fallback provider.
* **Cold starts/latency** → Pre-warm worker; cache; stream partial results; Fluid-style instance reuse if available.
* **Sandbox limits** → Keep viz code small; pre-bundle chart libs.
* **Hallucinations** → Deterministic task router, confidence floor, abstain, explicit citations.
* **Cost overruns** → Budgets + CostChip + spend logs; cheaper models for routing/extraction.
* **Security regressions** → Deny-by-default egress; package allow-list; CI checks for banned imports.

---

## 12) Setup & CLI Runbook

**Prereqs**

* Node LTS, Python 3.11+, `pnpm`, `uv` or `pip`, Vercel CLI.

**Clone & Install**

```bash
git clone https://github.com/vercel/examples
cd examples/apps/vibe-coding-platform
pnpm i
```

**Env & Linking**

```bash
vercel link
vercel env pull .env.local
# Add keys to Vercel dashboard or locally:
# POLYGON_API_KEY=...
# OPENAI_API_KEY=... (or AI_GATEWAY_KEY=...)
# SEDAR_COOKIE=... (if needed)
```

**Dev**

```bash
pnpm dev
```

**Python Worker (local)**

```bash
cd workers/python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 7071
```

**Local Tunneling for Server Actions (if needed)**

```bash
# e.g., for calling worker from Next.js in dev
# set WORKER_URL=http://localhost:7071
```

**Tests**

```bash
pnpm test
pytest -q
```

**CI**

* Add GitHub Actions workflow to run Node + Python jobs.
* Block merge on failing gates.

**Secrets Naming**

* `POLYGON_API_KEY`, `ALPHA_VANTAGE_KEY`, `YAHOO_RAPIDAPI_KEY`, `AI_GATEWAY_KEY`, `EMBEDDINGS_KEY`, `KV_URL`, `KV_TOKEN`, `WORKER_URL`.

---

## 13) Definition of Done (Project Level)

* All three MVP stories pass acceptance criteria.
* CI green (lint, types, unit, golden-file, property-based, contract, smoke).
* Staging deployed on Vercel with protected envs; Metrics tab shows live runs.
* Minimal docs at `/docs/ROADMAP.md` plus `/docs/SETUP.md`.
* Security posture verified: Sandbox no-egress, worker allowlist, keys scoped, audit logs on runs.
* “Not investment advice” footer visible; citations attached to all user-visible analytics outputs.

---

### Starter Context (recap)

* **Codename:** MadLab (NL-Finance)
* **Users:** Finance analysts/builders who demand citations, exports, reproducibility.
* **UI:** Ultra-minimal (keep Vibe look; tiny functional additions only).
* **Scope:** MVP only (Prompt-to-Chart, DCF/EPV, Ask-the-Filings) with production-grade guardrails.

> Paste this as `/docs/ROADMAP.md` and start with **Phase 0**. I can also generate `/docs/SETUP.md` and a GitHub Actions CI template on request.

Here's your comprehensive build-ready roadmap for MadLab on top of Vercel’s OSS Vibe platform. It details the MVP workflows, architectural components, UI contract, module/file structure with function signatures, acceptance criteria, data and security plans, testing strategy, phased milestones, risk mitigations, setup runbook, and definition of done—all formatted to drop into your repo’s documentation.

{{file\:file-SR54mBZJGhTP9eiLqKKpN4}}

This document should serve as a clear blueprint for your agentic development process. Let me know if you need any refinements or a matching `/docs/SETUP.md` to accompany it!

* refinements

# Quick verdict

Strong v1 blueprint: clear scope (3 MVP workflows), deterministic pipelines, strict Sandbox/worker split, guardrails, and an opinionated file layout. It’s buildable as-is.

Below are my **tight, actionable edits** to make it sharper, safer, and easier to ship in Cursor/Windsurf.

---

## What’s excellent (keep as written)

* **Interaction model** is crisp: Prompt → Plan → Approve → Execute → Preview/Artifacts.
* **Minimalist UI contract** respects the Vibe layout (critical to avoid scope creep).
* **Separation of concerns**: adapters ↔ pipelines ↔ sandbox/worker.
* **Acceptance criteria** per story are testable.
* **Cost/observability** hooks defined at the artifact level (good for finance audiences).

---

## High-priority upgrades (add these now)

### 1) Deterministic routing before LLM routing

* **Add** `/lib/tasks/rules.ts` with regex/keyword heuristics for `chart|dcf|filingQA` to avoid early model cost and variance.
* **Fall back** to LLM classification only on “unknown/compound” prompts.
* **Test** with a small prompt suite in `/tests/router.prompts.jsonl`.

### 2) Data correctness & units hygiene (finance must-haves)

* **Canonical units** module: `/lib/finance/units.ts`

  * Currency (CAD/USD) with FX source and effective date
  * Share counts (basic vs. diluted), per-share vs. absolute
  * Time base (FY, TTM, quarterly) and calendar alignment rules
* **Total return math**: make explicit how dividends are reinvested and on which schedule; document survivorship bias assumptions.

### 3) Canada-first coverage

* **Adapters**: put TSX/TSXV tickers first (e.g., ENB, TRP).
* **Ticker normalization**: `/lib/finance/tickers.ts` to map “ENB.TO” ↔ “ENB” and provider quirks.
* **SEDAR+ ingestion**: plan for PDF → text with page anchoring; store form type (AIF, MD\&A) explicitly.

### 4) Caching & rate-limits (more concrete)

* **KV keys**: `prices:{provider}:{ticker}:{metric}:{range}:{fxBase}`
* **TTLs**: intraday 5m; daily 24h; long-horizon 7d.
* **Collapsing window**: 150–250 ms per key to prevent fan-out in chat.

### 5) Reproducibility & lineage

* **Run manifest** `/out/run.json` per execution:

  * task, inputs, provider versions, model id, cache keys, file hashes, start/end timestamps, costs.
* **Seeded randomness** in Monte Carlo; record `randomSeed` in manifest.

### 6) Security details you’ll want on day 1

* **CSP** headers in Next.js; disallow inline scripts except hashed chunks.
* **No egress in Sandbox**; **deny-by-default** in worker with allowlist domain regex.
* **Secrets scanning** in CI with Gitleaks; **banned-imports** ESLint rule (e.g., `child_process`, `fs.promises.writeFile` outside `/out`).

### 7) Accessibility & clarity

* **Preview**: forced y-axis units, thousand separators, and currency symbol in titles.
* **Empty states** and **error toasts** with short, plain English (no stack traces).

---

## Targeted blueprint edits (ready to paste)

### New/adjusted files

* `/lib/tasks/rules.ts` — rule-based classifier returning `Task | null`.
* `/lib/finance/units.ts` — currency, FX, time base, share class helpers.
* `/lib/finance/tickers.ts` — `.normalize()`, `.toProvider()`, `.pretty()`.
* `/lib/observability/events.ts` — one event schema for **plan\_created**, **run\_started**, **run\_finished**, **abstained**.
* `/tests/router.spec.ts`, `/tests/dcf.property.spec.ts`, `/tests/chart.golden.spec.ts`
* `.github/workflows/ci.yml` — Node + Python matrix, Gitleaks, type-check, tests.
* `.env.example` — include `AI_GATEWAY_KEY`, `POLYGON_API_KEY`, `WORKER_URL`, `KV_*`.

### Function signatures to add

```ts
// /lib/tasks/rules.ts
export function classifyWithRules(prompt: string): Task | null;

// /lib/finance/units.ts
export function toCurrency(v: number, from: 'USD'|'CAD', to: 'USD'|'CAD', fxAt: string): number;
export function formatMoney(v: number, ccy: 'USD'|'CAD'): string;
export type TimeBase = 'TTM'|'FY'|'Q';
export function alignCalendar(series: {t:string; v:number}[], base: TimeBase): {t:string; v:number}[];

// /lib/observability/events.ts
export type RunEvent =
  | { type:'plan_created'; task: Task; ts:number }
  | { type:'run_started'; id:string; task: Task; ts:number }
  | { type:'run_finished'; id:string; metrics: MetricRecord; manifestPath:string; ts:number }
  | { type:'abstained'; id:string; reason:string; score:number; ts:number };
export function emit(ev: RunEvent): void;
```

### Acceptance-criteria tightenings

* **S-1 Chart**

  * Return **FX-normalized** total returns (`USD` or `CAD` selectable).
  * CSV saved as `prices_{tickers}_{range}_{ccy}.csv` with header `date,value,ccy`.
  * Drawdown calc tested against a golden series.

* **S-2 DCF/EPV**

  * Inputs validated with Zod (Node) and Pydantic (worker).
  * Sensitivity grid fixed ranges by default: `WACC 6–12% (1% step)` × `g 0.0–2.5% (0.5% step)`.
  * `dcf.xlsx` includes **Assumptions**, **CashFlows**, **Sensitivity** tabs; checksum recorded in manifest.

* **S-3 Filings**

  * Chunking policy: 1,000–1,500 tokens with 150 overlap; metadata `{ticker, form, year, page}`.
  * Answers include **at least two** distinct citations unless abstaining.
  * Confidence threshold default `≥0.62`; abstain below with reason shown.

---

## “Next three commits” (do these immediately)

1. **Router hardening**

   * Implement `classifyWithRules()`; wire `planTask()` to try rules → LLM fallback.
   * Add `/tests/router.spec.ts` with 20 canonical prompts (chart/DCF/filing).

2. **Units & ticker hygiene**

   * Add `units.ts` and `tickers.ts`, refactor `runChart()` to use them.
   * Verify ENB/TRP total return in both CAD and USD.

3. **Manifest + Cost chip wiring**

   * Implement run manifest; display **Not advice** footer + **Cost/Latency chip** populated from `MetricRecord`.

---

## Nice-to-have (don’t block MVP)

* **Prompt templates** saved per user for repeatability.
* **Scenario “playbooks”** for DCF (e.g., commodity cycle, margin normalization).
* **OTel exporter** for metrics to a backend (can be deferred).

---

## Overall quality check

* **Completeness:** 9/10 — you can build from this without guessing.
* **Risk posture:** 8/10 — add CSP, banned-imports, and worker egress allowlist to hit 10/10.
* **Reproducibility:** 8/10 — manifest + seeded randomness brings it to 10/10.
* **Fit to Vibe UI:** 10/10 — additions are surgical.
