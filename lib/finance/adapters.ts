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
