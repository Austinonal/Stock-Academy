# StockLab TH — Stock Academy & Market Simulator

เว็บแอปเรียนรู้หุ้นตั้งแต่ศูนย์จนถึงการวิจัยกลยุทธ์ ทำงานในเบราว์เซอร์ทั้งหมด (local-first) ไม่มี backend ไม่ต้องใช้ API key

> **เพื่อการศึกษาเท่านั้น** ไม่ใช่คำแนะนำการลงทุน ไม่เชื่อมต่อโบรกเกอร์ ไม่มีการซื้อขายเงินจริง ราคาและงบการเงินทั้งหมดเป็น **ข้อมูลจำลอง (Synthetic/Demo)** ของบริษัทสมมติ

## เริ่มใช้งาน
ต้องมี Node.js 20+ (ทดสอบกับ 22) และ npm
```bash
npm install
npm run dev          # เปิด http://localhost:5173
```

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict |
| `npm test -- --run` | Vitest (unit + component) |
| `npm run build` | build ไป `dist/` |
| `npm run preview` | เปิดดู build |
| `npm run smoke` | browser smoke test (ต้อง build ก่อน; ใช้ Google Chrome ในเครื่อง หรือ `CHROMIUM_PATH=...`) |

## ฟีเจอร์ที่ใช้งานได้จริง
- **ห้องเรียน** 17 ระดับ (L0–L16): L0–L3 เป็นบทเรียนเต็ม 12 บท (ตัวอย่างทีละขั้น สูตร ข้อผิดพลาดที่พบบ่อย quiz ≥ 3 ข้อพร้อมเหตุผลทุกตัวเลือก flashcard สรุป แหล่งอ่านต่อ เครื่องคำนวณดอกเบี้ยทบต้น/real return); L4–L16 เป็นโครงร่างหัวข้อ + quiz + ลิงก์ไปห้องแล็บ
- **Progress & Spaced repetition**: สถานะบทเรียน คะแนน quiz จำนวนครั้ง เกณฑ์ "พร้อมไปต่อ" 80% (ไม่ล็อก) คำถามที่ตอบผิดนัดทบทวนพรุ่งนี้ (SM-2 แบบย่อ) หน้า "ทบทวนวันนี้"
- **Chart Playground**: แท่งเทียน/Bar/เส้น, 1D/1W/1M, ช่วงข้อมูล, volume, crosshair + OHLCV legend, indicator หลายตัวพร้อมปรับ parameter, เครื่องมือวาด (เส้นแนวนอน, trend line, ray, กรอบโซน, Fibonacci, เลือก/ลบ/undo/ลบทั้งหมด บันทึกต่อ symbol+timeframe), **Replay** ทีละแท่ง (play/pause/speed, บันทึกการคาดการณ์ก่อนเปิดแท่ง; indicator คำนวณจากแท่งที่เปิดแล้วเท่านั้น)
- **Indicator Lab** 20 ตัว: SMA, EMA, WMA, VWMA, MACD, ADX/DI, RSI, Stochastic, Williams %R, ROC, CCI, Bollinger, Keltner, Donchian, ATR, OBV, A/D, CMF, MFI, Volume SMA (+ Pivot/Fibonacci ใน core) พร้อมสูตร ข้อจำกัด warm-up และเทียบพารามิเตอร์
- **Pattern Lab**: ตัวตรวจจับ 24 รูปแบบแท่งเทียนแบบ rule-based, แบบฝึกจำแนก (รวมกรณี "ไม่มีรูปแบบ"), สแกนข้อมูลพร้อมสถิติผลลัพธ์หลังเกิดเทียบฐาน
- **รูปแบบกราฟ (Chart Patterns)**: 13 รูปแบบ (หัวไหล่, ยอด/ก้นคู่, สามเหลี่ยม 3 แบบ, ธง, ลิ่ม, กรอบ, ถ้วยและหูจับ) แผนภาพแสดงสิ่งที่ตำราคาดคู่กับกรณีล้มเหลว + เงื่อนไขยืนยัน, measured move, จุดที่ถือว่าผิด, กับดัก
- **เทคนิคการเทรด**: 13 เทคนิคใน 7 หมวด (ตามแนวโน้ม, ทะลุกรอบ, สวนกลับ, กรอบเวลา, บริหารความเสี่ยง, จุดออก, วินัย) เขียนเป็นกฎที่ทดสอบได้ บอกว่าได้ผล/พังเมื่อไร และลิงก์ไปทดสอบในแล็บ
- **Fundamental Lab**: บริษัทสมมติ 4 แบบ (โตเร็ว / ปันผล / วัฏจักร / ธนาคาร) งบ 4 ปี, ratio 20+ ตัวที่แสดง N/A พร้อมเหตุผล, CAGR, แบบฝึกคำนวณ, DCF + ตาราง sensitivity, ตารางเทียบพร้อมคำเตือนข้ามอุตสาหกรรม
- **Screener**: 40 บริษัทสมมติ กรอง AND ตาม sector/ตัวเลข 9 ช่อง ค้นหา sort บันทึก preset แสดงเหตุผลที่ผ่าน
- **Paper Trading**: เงินจำลอง ตั้งทุน/ค่าธรรมเนียม/slippage ได้, market & limit order, fill ที่แท่งถัดไปพร้อมเหตุผล, กันขายเกิน/เงินไม่พอ, realized/unrealized P&L, equity curve, export CSV/JSON
- **Backtester**: SMA crossover, Donchian breakout, RSI (ทดลอง) · fill ที่ open แท่งถัดไป · ค่าธรรมเนียม/slippage · in-sample/out-of-sample · equity vs buy&hold · drawdown · metrics ครบ (N/A เมื่อข้อมูลไม่พอ) · รายการเทรด · สมมติฐานและคำเตือน
- **Portfolio & Risk Lab**: จัดสรรพอร์ต target vs actual, volatility, max drawdown, correlation, position sizing, recovery math, ขาดทุนติดต่อกัน, Monte Carlo
- **Journal**: thesis / หลักฐาน / เงื่อนไขที่ผิด / ความเสี่ยง / ผลลัพธ์ / บทเรียน, tags, ค้นหา, export/import JSON
- **คลังศัพท์** 166 คำ 11 หมวด ค้นหาไทย/อังกฤษ
- **Data Center**: นำเข้า CSV (preview, error รายแถว, column aliases, จำกัดขนาด) และ JSON, ดาวน์โหลดตัวอย่าง/คู่มือ schema, สำรอง/กู้คืนทั้งหมด (merge/replace), รีเซ็ตพร้อมยืนยัน, ธีม Light/Dark

## ข้อมูลจำลอง
- ราคา: generator แบบ deterministic (`src/core/market-data/synthetic.ts`, PRNG mulberry32 + seed) สร้างช่วง uptrend/downtrend/sideways/breakout/gap/volatility expansion; ทุกแท่งผ่าน validator (`high ≥ max(o,c)` ฯลฯ); วันทำการจันทร์–ศุกร์ ไม่นับวันหยุดตลาดจริง
- symbol ทั้งหมด (DMTECH, DMBANK, DMSTEEL, DMFOOD และ DM*** ใน screener) เป็นบริษัทสมมติ
- ไฟล์ตัวอย่าง: `public/sample-data/demo-candles.csv`, `public/sample-data/demo-financials.json`
- ค่าธรรมเนียม/slippage เริ่มต้น (0.15%, 5 bps) เป็นสมมติฐาน ไม่ใช่อัตราจริงของโบรกเกอร์ใด กฎตลาด (lot/tick size, settlement, ภาษี) ต้องตรวจจาก SET/กรมสรรพากรล่าสุด

## ข้อมูลส่วนตัว
ทุกอย่างเก็บใน IndexedDB ของเบราว์เซอร์นี้ (ถ้าใช้ไม่ได้จะใช้หน่วยความจำชั่วคราวและแจ้งเตือน) ไม่มี login/cloud sync/analytics ล้างข้อมูลเบราว์เซอร์แล้วข้อมูลหาย — ส่งออกไฟล์สำรองที่ Data Center

## ไฟล์หลัก
- `src/core/` — indicators, patterns, backtest, paper engine, fundamentals/DCF, risk, SRS, market-data (provider, validator, CSV)
- `src/components/charts/PriceChart.tsx` — wrapper ของ Lightweight Charts v5 + overlay SVG สำหรับเครื่องมือวาด
- `src/content/curriculum/`, `src/content/glossary/` — เนื้อหา
- `src/storage/` — IndexedDB (Dexie), backup/restore, schema version
- `scripts/smoke.mjs` — browser smoke test

## Dependencies (และเหตุผล)
react / react-dom / react-router-dom (UI, routing) · lightweight-charts (กราฟการเงิน, Apache-2.0 ต้องแสดง attribution — แสดงโลโก้บนกราฟและลิงก์ใน footer) · dexie (IndexedDB) · lucide-react (ไอคอน) · tailwindcss (สไตล์) · dev: vite, typescript, vitest, testing-library, jsdom, fake-indexeddb, eslint, playwright-core (smoke test โดยไม่ดาวน์โหลด browser)
ไม่ได้ใช้ zod: validation ทำด้วยฟังก์ชันเฉพาะที่ให้ข้อความ error ภาษาไทยรายแถว

## ข้อจำกัดที่ทราบ
ดู `IMPLEMENTATION_STATUS.md`

## นำขึ้น GitHub / GitHub Pages
1. push ขึ้น repository (CI ที่ `.github/workflows/ci.yml` จะรัน lint/typecheck/test/build)
2. ตั้ง Settings → Pages → Source = **GitHub Actions**
3. push เข้า branch `main` → `.github/workflows/deploy-pages.yml` จะ deploy
แอปใช้ `base: './'` + hash routing จึงไม่ต้องแก้ชื่อ repo ใน config
