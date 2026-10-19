# StockLab TH — Stock Academy & Market Simulator

เว็บแอปเรียนรู้หุ้นตั้งแต่ศูนย์ ทำงานในเบราว์เซอร์ทั้งหมด ไม่มี backend ไม่ต้องใช้ API key
ราคาและงบการเงินทั้งหมดเป็น **ข้อมูลจำลอง** เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน

- เว็บ: https://austinonal.github.io/Stock-Academy/ (ต้องตั้งค่า Pages ก่อน ดูหัวข้อ "ค้างอยู่ตอน deploy")
- วิธีรัน ฟีเจอร์ที่มี สถาปัตยกรรม: [README_TH.md](README_TH.md)
- กติกาสำหรับพัฒนาต่อ: [CLAUDE.md](CLAUDE.md)

```bash
npm install && npm run dev      # http://localhost:5173
npm run lint && npm run typecheck && npm test -- --run && npm run build
npm run smoke                   # ต้อง build ก่อน
```

---

# งานที่ยังไม่ได้ทำ (Backlog)

อัปเดตล่าสุด 2026-10-19 · เรียงตามความสำคัญ · ✅ = ทำแล้ว ไม่ต้องทำซ้ำ (อยู่ท้ายสุด)

## ค้างอยู่ตอน deploy (ต้องทำใน GitHub Settings — ทำผ่านโค้ดไม่ได้)
- [ ] **เปิด GitHub Pages**: Settings → Pages → Source = **GitHub Actions** (ตอนนี้ยังเป็น "Deploy from a branch" ทำให้เว็บขึ้นหน้าขาว เพราะส่งไฟล์ต้นฉบับที่ยังไม่ได้ build)
- [ ] **แก้กฎ environment**: Settings → Environments → `github-pages` → Deployment branches → เพิ่ม `main` (หรือเลือก No restriction) แล้วลบกฎ branch เก่า
- [ ] รัน workflow "Deploy to GitHub Pages" บน `main` อีกครั้ง แล้วเปิดเว็บตรวจว่าขึ้นครบทุกหน้า
- [ ] ลด branch ที่ไม่ใช้: `claude/layout-topnav` (ซ้ำกับ main) และ `claude/stocklab-mvp` เมื่อไม่ต้องใช้แล้ว

## 1. เนื้อหาการเรียน
- [ ] **ขยายบทเรียน L4–L16** จากบทละ 1 เป็น 2–3 บทต่อระดับ (L0–L3 มีระดับละ 3 บทแล้ว) ใช้ template ใน `src/content/curriculum/types.ts` ลำดับแนะนำ: L4 (Price Action), L5 (Indicators), L7 (งบการเงิน), L8 (Valuation), L13 (Backtesting)
- [ ] **ให้ผู้เชี่ยวชาญตรวจเนื้อหา** — บทเรียน เกณฑ์รูปแบบเทียน รูปแบบกราฟ และเทคนิคการเทรดทั้งหมดเขียนโดย AI ตัวเลขในตัวอย่างตรวจแล้ว แต่ข้อความเชิงแนวคิดและมุมมอง "ตำรามองว่า" ยังไม่ผ่านการทบทวนโดยผู้มีความรู้ด้านการลงทุน
- [ ] ตรวจและอ้างอิงกฎตลาดไทย (lot/tick size, settlement, ภาษี, ค่าธรรมเนียม) จาก SET/กรมสรรพากร พร้อมวันที่ตรวจ — ตอนนี้เนื้อหาบอกให้ผู้ใช้ไปตรวจเอง
- [ ] เพิ่ม quiz ให้มากกว่า 3 ข้อต่อบท และคลังโจทย์สำหรับทบทวน

## 2. กราฟและเครื่องมือวิเคราะห์
- [ ] **ตัวตรวจจับรูปแบบกราฟอัตโนมัติบนกราฟ** (ยอดคู่ สามเหลี่ยม ธง ฯลฯ) ตอนนี้มีแค่คลังความรู้ 13 แบบ (`/chart-patterns`) และตัวตรวจจับแท่งเทียนระดับแท่ง (`src/core/patterns/candles.ts`) ต้องใช้ swing high/low + เกณฑ์ความคลาดเคลื่อน และต้องไม่ใช้ข้อมูลอนาคต
- [ ] **ทดสอบรูปแบบกราฟเป็นกลยุทธ์ใน Backtester** พร้อมสถิติเทียบ base rate
- [ ] Indicator ที่ยังไม่ทำ (ห้ามใส่ใน `INDICATORS` จนกว่าจะมี test): Ichimoku, Parabolic SAR, Supertrend, Stochastic RSI, Relative Strength เทียบ benchmark, VWAP (ต้องมีข้อมูล intraday)
- [ ] เครื่องมือวาด: **ลาก/แก้จุดของเส้นที่วาดแล้ว** (ตอนนี้ต้องลบแล้ววาดใหม่), เส้นไม่ขยับตามเมื่อลากแกนราคา (อัปเดตเมื่อขยับเมาส์/เลื่อนแกนเวลา), ยังไม่รองรับ touch
- [ ] สลับสเกล log/linear บนกราฟ

## 3. การจำลองและทดสอบกลยุทธ์
- [ ] Paper Trading: ใช้ได้เฉพาะ symbol demo (ต้องมีปฏิทินวันเดียวกัน), ยังไม่มี stop/stop-limit order และ short selling
- [ ] Backtester: walk-forward หลายหน้าต่าง (ตอนนี้มี in/out-of-sample แบบเดียว), กลยุทธ์หลาย symbol/พอร์ต, short, บันทึกชุดการตั้งค่า
- [ ] Watchlist (ตอนนี้ใช้ preset ใน screener แทน)
- [ ] Screener: เงื่อนไข OR, จัดกลุ่ม/เรียงอันดับพร้อมคำอธิบายวิธีคิด

## 4. ข้อมูล
- [ ] ข้อมูลจำลองไม่มี corporate actions (split/ปันผล) และวันหยุดตลาดจริง; correlation ระหว่าง symbol ใกล้ 0 เพราะสร้างแยกกัน — ควรมีชุดข้อมูลที่ symbol เคลื่อนไหวสัมพันธ์กันบางส่วน
- [ ] ข้อมูลรายชั่วโมง/intraday (ต้องใช้สำหรับ VWAP)
- [ ] `LiveMarketDataProvider` ยังเป็นแค่ interface ว่าง — ถ้าจะต่อข้อมูลสดต้องเลือกผู้ให้บริการที่มีใบอนุญาตชัดเจน ห้าม scrape

## 5. คุณภาพ / วิศวกรรม
- [ ] ตรวจหน้าตาด้วยตา: ธีมสว่างและมือถือของหน้า `/chart-patterns`, `/techniques` และบทเรียน L4–L16 (ตรวจแล้วเฉพาะธีมมืดบนเดสก์ท็อป)
- [ ] ทดสอบบนอุปกรณ์มือถือจริง (ตอนนี้ทดสอบด้วย Chromium จำลองความกว้าง 390px)
- [ ] เพิ่ม e2e ที่ลึกกว่า smoke test (flow paper trading, import CSV จริงในเบราว์เซอร์)
- [ ] ตรวจ accessibility ด้วยเครื่องมืออัตโนมัติ (axe) และทดสอบ screen reader
- [ ] Service worker (`public/sw.js`): ถ้าเปลี่ยนวิธี build ต้องเปลี่ยนชื่อ cache `stocklab-v1` ด้วย; ยังไม่มีข้อความแจ้งผู้ใช้เมื่อมีเวอร์ชันใหม่; ทำงานเฉพาะ build จริง ไม่ทำงานตอน `npm run dev`
- [ ] แยกไฟล์หน้าใหญ่ (`ChartPage`, `FundamentalPage`, `DataCenterPage`) เป็นคอมโพเนนต์ย่อย
- [ ] เพิ่ม `zod` หรือเทียบเท่าถ้า schema นำเข้าซับซ้อนขึ้น (ตอนนี้ validate ด้วยฟังก์ชันเฉพาะ)
- [ ] เมนู: ช่องค้นหาด่วน (Ctrl+K), เลื่อนแท็บให้นุ่มนวล

## ✅ ทำแล้ว (ไม่ต้องทำซ้ำ)
บทเรียนเต็ม 25 บท (L0–L16) · คลังศัพท์ 166 คำ · Chart Playground + Replay + เครื่องมือวาด · Indicator Lab 20 ตัว · Pattern Lab 24 แท่งเทียน · รูปแบบกราฟ 13 แบบ · เทคนิคการเทรด 13 แบบ · Fundamental Lab + DCF · Screener · Paper Trading · Backtester · Risk Lab · Journal · Data Center (CSV/JSON/backup) · ธีมมืด/สว่าง · เมนูสองชั้นด้านบน · ใช้งานออฟไลน์ + ฟอนต์ในตัว · CI + workflow deploy
