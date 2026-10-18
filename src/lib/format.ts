export const fmt = (n: number | null | undefined, d = 2) =>
  n === null || n === undefined || !Number.isFinite(n) ? 'N/A' : n.toLocaleString('th-TH', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (n: number | null | undefined, d = 1) => (n === null || n === undefined || !Number.isFinite(n) ? 'N/A' : `${(n * 100).toFixed(d)}%`);
export const int = (n: number) => Math.round(n).toLocaleString('th-TH');

export function download(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
