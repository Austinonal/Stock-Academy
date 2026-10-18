import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '../test/render';
import { clearAll, getItem } from '../storage/db';
import LessonPage from './learning/LessonPage';
import DashboardPage from './dashboard/DashboardPage';
import ScreenerPage from './screener/ScreenerPage';
import PaperPage from './paper-trading/PaperPage';
import DataCenterPage from './settings/DataCenterPage';
import GlossaryPage from './glossary/GlossaryPage';
import type { Progress } from './learning/state';
import type { PaperState } from '../core/paper/engine';

vi.mock('../components/charts/PriceChart', () => ({ PriceChart: () => <div data-testid="chart" /> }));

beforeEach(async () => { await clearAll(); });
afterEach(cleanup);

describe('learning flow', () => {
  it('mark complete updates progress and persists across a remount (reload)', async () => {
    const user = userEvent.setup();
    renderAt('/learn/l0-compound', '/learn/:lessonId', <LessonPage />);
    await user.click(await screen.findByRole('button', { name: /ทำเครื่องหมายว่าเรียนจบ/ }));
    await waitFor(async () => expect((await getItem<Progress>('progress'))?.lessons['l0-compound'].status).toBe('done'));
    cleanup();
    renderAt('/', '/', <DashboardPage />);
    const stat = await screen.findByText('บทเรียนที่เรียนจบ');
    expect(within(stat.parentElement!).getByText(/^1 \//)).toBeInTheDocument();
  });

  it('quiz scores against the answer key, shows explanations, and schedules wrong answers for review', async () => {
    const user = userEvent.setup();
    renderAt('/learn/l0-compound', '/learn/:lessonId', <LessonPage />);
    const quiz = await screen.findByRole('form', { name: 'แบบทดสอบ' });
    // Q1 correct (1,210), Q2 wrong (8 ปี), Q3 correct (ผลตอบแทนคงที่)
    await user.click(within(quiz).getByLabelText('1,210 บาท'));
    await user.click(within(quiz).getByLabelText('8 ปี'));
    await user.click(within(quiz).getByLabelText('สมมติว่าผลตอบแทนคงที่ทุกงวด'));
    await user.click(within(quiz).getByRole('button', { name: 'ส่งคำตอบ' }));
    expect(within(quiz).getByText('คะแนน 2/3')).toBeInTheDocument();
    expect(within(quiz).getByText(/1,000 × 1.1² = 1,210/)).toBeInTheDocument();
    await waitFor(async () => {
      const p = await getItem<Progress>('progress');
      expect(p?.lessons['l0-compound'].best).toBeCloseTo(2 / 3);
      const deck = await getItem<Record<string, { lapses: number }>>('srs');
      expect(deck?.['q-l0c-2'].lapses).toBe(1);
      expect(deck?.['q-l0c-1'].lapses).toBe(0);
    });
  });
});

describe('screener', () => {
  it('filters change the result set', async () => {
    const user = userEvent.setup();
    renderAt('/', '/', <ScreenerPage />);
    expect(await screen.findByText(/ผ่านเงื่อนไข 40 จาก 40/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('กลุ่มอุตสาหกรรม'), 'Technology');
    expect(screen.getByText(/ผ่านเงื่อนไข 7 จาก 40/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('P/E สูงสุด'), '30');
    const n = Number(screen.getByText(/ผ่านเงื่อนไข \d+ จาก 40/).textContent!.match(/ผ่านเงื่อนไข (\d+)/)![1]);
    expect(n).toBeLessThan(7);
    await user.click(screen.getByRole('button', { name: 'ล้างตัวกรอง' }));
    expect(screen.getByText(/ผ่านเงื่อนไข 40 จาก 40/)).toBeInTheDocument();
  });
});

describe('paper trading', () => {
  it('buy then sell changes cash, position and realized P&L', async () => {
    const user = userEvent.setup();
    renderAt('/', '/', <PaperPage />);
    await screen.findByText('ส่งคำสั่งจำลอง');
    await user.click(screen.getByRole('button', { name: /ส่งคำสั่งจำลอง \(ไม่ใช่เงินจริง\)/ }));
    expect(await screen.findByText(/ส่งคำสั่งจำลองแล้ว/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /เดินหน้า 1 แท่ง/ }));
    await waitFor(async () => expect((await getItem<PaperState>('paper'))?.positions.DMTECH?.qty).toBe(100));
    const afterBuy = (await getItem<PaperState>('paper'))!;
    expect(afterBuy.cash).toBeLessThan(100_000);

    await user.selectOptions(screen.getByLabelText('ฝั่ง'), 'sell');
    await user.click(screen.getByRole('button', { name: /ส่งคำสั่งจำลอง \(ไม่ใช่เงินจริง\)/ }));
    await user.click(screen.getByRole('button', { name: /เดินหน้า 1 แท่ง/ }));
    await waitFor(async () => expect((await getItem<PaperState>('paper'))?.positions.DMTECH).toBeUndefined());
    const s = (await getItem<PaperState>('paper'))!;
    const realized = s.fills.reduce((a, f) => a + f.realized, 0);
    expect(s.cash).toBeCloseTo(100_000 + realized, 6);
    expect(realized).not.toBe(0); // fees + price change
  });

  it('rejects overselling with a message', async () => {
    const user = userEvent.setup();
    renderAt('/', '/', <PaperPage />);
    await screen.findByText('ส่งคำสั่งจำลอง');
    await user.selectOptions(screen.getByLabelText('ฝั่ง'), 'sell');
    await user.click(screen.getByRole('button', { name: /ส่งคำสั่งจำลอง \(ไม่ใช่เงินจริง\)/ }));
    expect(await screen.findByText(/ขายเกินจำนวนที่ถือ/)).toBeInTheDocument();
  });
});

describe('data center', () => {
  it('invalid CSV shows an error without crashing; valid rows preview with per-row errors', async () => {
    const user = userEvent.setup();
    renderAt('/', '/', <DataCenterPage />);
    const input = screen.getByLabelText('ไฟล์ CSV') as HTMLInputElement;
    await act(() => user.upload(input, new File(['Date,Price\n2024-01-01,10'], 'bad.csv', { type: 'text/csv' })));
    expect(await screen.findByText(/ไม่พบคอลัมน์/)).toBeInTheDocument();
    await act(() => user.upload(input, new File(['Date,Open,High,Low,Close,Volume\n2024-01-02,10,11,9,10,5\n2024-01-03,10,11,9,10,5\n2024-01-04,10,8,9,10,5'], 'mix.csv', { type: 'text/csv' })));
    expect(await screen.findByText(/ผ่าน/)).toBeInTheDocument();
    expect(screen.getByText(/high ต้อง ≥ max/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /ยืนยันนำเข้า 2 แท่ง/ }));
    await waitFor(async () => expect((await getItem<Record<string, unknown>>('imported'))?.MYDATA).toBeTruthy());
  });

  it('rejects a backup file from another app', async () => {
    const user = userEvent.setup();
    renderAt('/', '/', <DataCenterPage />);
    await act(() => user.upload(screen.getByLabelText('ไฟล์สำรอง') as HTMLInputElement, new File(['{"app":"other","data":{}}'], 'x.json', { type: 'application/json' })));
    expect(await screen.findByText(/ไม่ใช่ไฟล์สำรองของ StockLab TH/)).toBeInTheDocument();
  });
});

describe('glossary', () => {
  it('searches Thai and English', async () => {
    const user = userEvent.setup();
    renderAt('/', '/', <GlossaryPage />);
    await user.type(screen.getByLabelText('ค้นหา'), 'แนวรับ');
    expect(screen.getByText(/พบ 1 คำ/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText('ค้นหา'));
    await user.type(screen.getByLabelText('ค้นหา'), 'drawdown');
    expect(screen.getByText('การย่อตัวจากจุดสูงสุด')).toBeInTheDocument();
  });
});
