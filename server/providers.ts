export const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'IBM', 'SPY'];
export type Bar = { date: string; open: string; high: string; low: string; close: string; volume: string };
export function parseDaily(input: unknown): Bar[] {
  const payload = input as Record<string, unknown>;
  if (!payload || typeof payload !== 'object' || payload.Information || payload.Note || payload['Error Message']) throw new Error('El proveedor rechazó la consulta: revisa acceso, clave o cuota.');
  const series = payload['Time Series (Daily)'];
  if (!series || typeof series !== 'object') throw new Error('No se recibió una serie diaria válida.');
  const bars = Object.entries(series).map(([date, raw]) => {
    const row = raw as Record<string, string>;
    const bar = { date, open: row['1. open'], high: row['2. high'], low: row['3. low'], close: row['4. close'], volume: row['5. volume'] };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Object.values(bar).slice(1).every(v => typeof v === 'string' && /^\d+(\.\d+)?$/.test(v) && Number.isFinite(Number(v))) || Number(bar.low) <= 0 || Number(bar.high) < Number(bar.low) || Number(bar.open) < Number(bar.low) || Number(bar.open) > Number(bar.high) || Number(bar.close) < Number(bar.low) || Number(bar.close) > Number(bar.high)) throw new Error('Datos de precios incompletos o incoherentes.');
    return bar;
  }).sort((a,b) => a.date.localeCompare(b.date));
  if (bars.length < 51) throw new Error('Se necesitan al menos 51 sesiones para preparar y probar la estrategia.');
  return bars;
}
export function parseFx(xml: string) {
  const rows: {date: string; usd: string}[] = [];
  for (const match of xml.matchAll(/<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]>([\s\S]*?)<\/Cube>/g)) {
    const rate = /<Cube\s+currency=['"]USD['"]\s+rate=['"]([\d.]+)['"]/.exec(match[2]);
    if (rate && Number.isFinite(Number(rate[1])) && Number(rate[1]) > 0) rows.push({ date: match[1], usd: rate[1] });
  }
  if (!rows.length) throw new Error('El BCE no devolvió referencias USD válidas.');
  return rows.sort((a,b) => a.date.localeCompare(b.date));
}
export async function getJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {...init, signal: AbortSignal.timeout(60000)});
  if (!response.ok) throw new Error('La conexión devolvió un error.');
  return response.json();
}
