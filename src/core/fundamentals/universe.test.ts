import { buildUniverse, screen } from './universe';

describe('screener', () => {
  const rows = buildUniverse();
  it('is deterministic and includes the detailed companies', () => {
    expect(buildUniverse()).toEqual(rows);
    expect(rows.find((r) => r.symbol === 'DMFOOD')).toBeTruthy();
    expect(rows.length).toBe(40);
  });
  it('filters with AND and reports reasons', () => {
    const res = screen(rows, { sector: 'Technology', query: '', ranges: { pe: { max: 30 }, netMargin: { min: 0 } } });
    expect(res.length).toBeGreaterThan(0);
    for (const { row, reasons } of res) {
      expect(row.sector).toBe('Technology');
      expect(row.pe!).toBeLessThanOrEqual(30);
      expect(row.netMargin!).toBeGreaterThanOrEqual(0);
      expect(reasons).toHaveLength(2);
    }
  });
  it('null values never pass a range; empty filters return everything', () => {
    expect(screen(rows, { sector: 'all', query: '', ranges: { pe: { min: 0 } } }).every((x) => x.row.pe !== null)).toBe(true);
    expect(screen(rows, { sector: 'all', query: '', ranges: { pe: {} } })).toHaveLength(rows.length);
    expect(screen(rows, { sector: 'all', query: 'dmfood', ranges: {} }).map((x) => x.row.symbol)).toEqual(['DMFOOD']);
  });
});
