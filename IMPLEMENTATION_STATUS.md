# IMPLEMENTATION_STATUS

ตรวจล่าสุด: 2026-10-18 · `lint` ✅ · `typecheck` ✅ · `test` ✅ (unit + component) · `build` ✅ · `smoke` ✅ (Chromium headless: 15 routes, วาดเส้น+persist, replay, quiz, backtest, mobile menu, ไม่มี console/page error)

## เสร็จและทดสอบแล้ว
ดูรายการใน README_TH.md → "ฟีเจอร์ที่ใช้งานได้จริง"

## ยังไม่ทำ / ข้อจำกัด
- บทเรียน L4–L16 มีบทละ 1 บท (L0–L3 มี 3 บทต่อระดับ) — ขยายเป็นหลายบทต่อระดับได้ตาม template เดิม
2. Indicator ที่ยังไม่ implement (จึงไม่แสดงใน UI): Ichimoku, Parabolic SAR, Supertrend, Stochastic RSI, VWAP (ต้องใช้ข้อมูล intraday), Relative Strength เทียบ benchmark
3. Chart patterns ระดับโครงสร้าง มีคลังความรู้ 13 แบบพร้อมแผนภาพ (หน้า /chart-patterns) แต่ยังไม่มีตัวตรวจจับอัตโนมัติบนกราฟ
4. เครื่องมือวาด: ยังลาก/แก้ไขจุดของเส้นที่วาดแล้วไม่ได้ (ลบแล้ววาดใหม่) และไม่ได้ปรับตามการซูมแกนราคาแบบลาก (อัปเดตเมื่อเลื่อน/ซูมแกนเวลาหรือขยับเมาส์)
5. ไม่มีสเกล log ให้สลับ, ไม่มี walk-forward แบบหลายหน้าต่าง (มี in/out-of-sample split แบบเดียว)
6. Paper trading ใช้ได้กับ symbol demo เท่านั้น (ต้องใช้ปฏิทินวันทำการร่วมกัน), ไม่มี stop order และ short
7. Watchlist ยังไม่มี (ใช้ preset ใน screener แทน)
9. ข้อมูลจำลองไม่มี corporate actions และวันหยุดตลาดจริง; correlation ระหว่าง symbol ใกล้ 0 เพราะสร้างแยกกัน
