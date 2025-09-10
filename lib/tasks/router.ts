export type ChartTask = { kind:'chart'; tickers: string[]; range: string; metric: 'close'|'total_return'; flags?: { drawdowns?: boolean; annotations?: string[] } };
export type DcfTask   = { kind:'dcf'; ticker: string; horizon: number; wacc?: number; scenarios?: { base: any; bull?: any; bear?: any } };
export type FilingTask= { kind:'filingQA'; ticker?: string; question: string; k?: number };

export type Task = ChartTask | DcfTask | FilingTask;

export function routePromptToTask(prompt: string): Task {
  // Simple routing logic - in real implementation, use AI to parse
  if (prompt.toLowerCase().includes('chart') || prompt.toLowerCase().includes('plot')) {
    return { kind: 'chart', tickers: ['AAPL'], range: '1y', metric: 'close' }; // Mock
  }
  if (prompt.toLowerCase().includes('dcf') || prompt.toLowerCase().includes('valuation')) {
    return { kind: 'dcf', ticker: 'AAPL', horizon: 5 }; // Mock
  }
  if (prompt.toLowerCase().includes('filing') || prompt.toLowerCase().includes('sec')) {
    return { kind: 'filingQA', question: prompt }; // Mock
  }
  // Default to chart
  return { kind: 'chart', tickers: ['AAPL'], range: '1y', metric: 'close' };
}

export function taskToPlan(task: Task): { steps: string[]; inputs: Record<string, any> } {
  switch (task.kind) {
    case 'chart':
      return {
        steps: ['Fetch price data', 'Generate chart code', 'Execute in sandbox'],
        inputs: { tickers: task.tickers, range: task.range, metric: task.metric }
      };
    case 'dcf':
      return {
        steps: ['Fetch fundamentals', 'Compute DCF', 'Generate sensitivity'],
        inputs: { ticker: task.ticker, horizon: task.horizon }
      };
    case 'filingQA':
      return {
        steps: ['Search filings', 'Retrieve relevant text', 'Generate answer'],
        inputs: { question: task.question }
      };
  }
}
