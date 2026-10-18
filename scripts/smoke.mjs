// Browser smoke test: builds must exist (npm run build). Starts `vite preview`, visits every route,
// fails on console/page errors, and exercises the chart, drawing tool, quiz and backtester.
// Browser: CHROMIUM_PATH=/path/to/chrome, otherwise the locally installed Google Chrome (channel "chrome").
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const ROUTES = ['/', '/learn', '/learn/l0-compound', '/review', '/glossary', '/techniques', '/chart-patterns', '/chart', '/indicators', '/patterns', '/fundamentals', '/screener', '/paper', '/backtest', '/risk', '/journal', '/data'];
const shotDir = process.env.SMOKE_SHOTS; // optional: directory for screenshots

// spawn vite's JS entry directly so kill() reaches the server itself (not an npx wrapper)
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
const stop = () => server.kill();
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve(); } });
  server.on('exit', (c) => reject(new Error(`preview exited ${c}`)));
});

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
// don't wait on the external font stylesheet
const go = (r) => page.goto(`${BASE}#${r}`, { waitUntil: 'domcontentloaded' });
const errors = [];
// Font CDN may be unreachable offline; that is cosmetic, not an app error
const ignorable = (t) => /fonts\.(googleapis|gstatic)\.com|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION|net::ERR_/.test(t);
page.on('console', (m) => { if (m.type() === 'error' && !ignorable(m.text() + (m.location()?.url ?? ''))) errors.push(`[console] ${page.url()} ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${page.url()} ${e.message}`));
const check = (cond, msg) => { if (!cond) errors.push(`[check] ${msg}`); };

try {
  for (const r of ROUTES) {
    await go(r);
    await page.locator('main h1').first().waitFor({ timeout: 10000 });
    check(!(await page.locator('text=หน้านี้เกิดข้อผิดพลาด').count()), `error boundary on ${r}`);
    if (shotDir) await page.screenshot({ path: `${shotDir}/${r === '/' ? 'home' : r.slice(1).replace(/\//g, '_')}.png`, fullPage: false });
  }

  // Chart renders a canvas and the horizontal-line tool draws an SVG line
  await go('/chart');
  await page.locator('canvas').first().waitFor();
  check((await page.locator('text=ข้อมูลจำลอง (Synthetic/Demo)').count()) > 0, 'demo badge on chart page');
  await page.getByRole('button', { name: 'เส้นแนวนอน' }).click();
  const box = await page.locator('[role=img][aria-label^="กราฟราคา"]').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + 150);
  await page.waitForTimeout(300);
  check((await page.locator('svg line').count()) > 0, 'drawing a horizontal line');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('canvas').first().waitFor();
  await page.waitForTimeout(500);
  check((await page.locator('svg line').count()) > 0, 'drawing persisted after reload');
  await page.getByRole('button', { name: 'เริ่ม Replay' }).click();
  await page.getByRole('button', { name: /เปิดแท่งถัดไป/ }).click();
  check((await page.locator('text=แท่งที่ 122').count()) > 0, 'replay advances one bar');

  // Quiz scoring in a real browser
  await go('/learn/l0-compound');
  await page.getByLabel('1,210 บาท').check();
  await page.getByLabel('9 ปี').check();
  await page.getByLabel('สมมติว่าผลตอบแทนคงที่ทุกงวด').check();
  await page.getByRole('button', { name: 'ส่งคำตอบ' }).click();
  check((await page.locator('text=คะแนน 3/3').count()) === 1, 'quiz 3/3');

  // Backtester runs and shows metrics
  await go('/backtest');
  await page.getByRole('button', { name: /รัน Backtest/ }).click();
  await page.locator('text=Out-of-sample').first().waitFor();
  check((await page.locator('text=Max drawdown').count()) > 0, 'backtest metrics');
  if (shotDir) await page.screenshot({ path: `${shotDir}/backtest-run.png`, fullPage: true });

  // Mobile layout: section tabs switch the page list, no horizontal page overflow
  await page.setViewportSize({ width: 390, height: 800 });
  await go('/');
  await page.getByRole('link', { name: 'จำลอง & ความเสี่ยง' }).click();
  await page.getByRole('link', { name: /ทดสอบย้อนหลัง/ }).click();
  check(page.url().endsWith('#/backtest'), 'mobile two-tier navigation');
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal page scroll on mobile');
  // the last section and its page must be scrolled fully into view in their tab rows
  await go('/data');
  await page.locator('main h1').first().waitFor();
  await page.waitForTimeout(200);
  const inView = (name) => page.getByRole('link', { name }).first().evaluate((el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth; });
  check(await inView('ระบบ'), 'active section tab scrolled into view on mobile');
  check(await inView(/ตั้งค่า & ข้อมูล/), 'active page tab scrolled into view on mobile');
  await page.locator('main h1').first().waitFor();
  await page.waitForTimeout(300);
  if (shotDir) await page.screenshot({ path: `${shotDir}/mobile.png` });
} finally {
  await browser.close();
  stop();
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`smoke OK — ${ROUTES.length} routes, chart/drawing/replay/quiz/backtest/mobile nav checks passed`);
process.exit(0);
