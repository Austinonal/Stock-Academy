export type Candle = {
  time: string; // ISO date YYYY-MM-DD (daily or period-start for weekly/monthly)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Timeframe = '1D' | '1W' | '1M';

export type SeriesMeta = {
  symbol: string;
  name: string;
  sector: string;
  timeframe: Timeframe;
  currency: 'THB';
  timezone: 'Asia/Bangkok';
  source: 'synthetic' | 'csv' | 'json';
  adjusted: false;
  seed?: number;
  note: string;
};

export type MarketSeries = { meta: SeriesMeta; candles: Candle[] };

/** Every provider (demo, CSV, JSON, future live) returns the same shape so UI/indicators/backtester never change. */
export interface MarketDataProvider {
  readonly id: string;
  listSymbols(): string[];
  getSeries(symbol: string, timeframe: Timeframe): MarketSeries | null;
}
