# CLAUDE.md — กติกาสำหรับพัฒนาต่อ

## คำสั่ง
- `npm run dev` · `npm run lint` · `npm run typecheck` · `npm test -- --run` · `npm run build`
- `npm run smoke` — ต้อง `npm run build` ก่อน; ใช้ Chrome ในเครื่อง หรือกำหนด `CHROMIUM_PATH`

## สถาปัตยกรรม
- `src/core/**` = logic ล้วน (ไม่ import React) มี unit test อยู่ข้างไฟล์ (`*.test.ts`) — สูตรใหม่ต้องมี test ก่อนเปิดใน UI
- `src/features/<page>/` = หน้าจอ; `src/components/` = UI ร่วม (`PriceChart`, `ui.tsx`)
- `src/content/` = หลักสูตร (data-driven) และคลังศัพท์
- ข้อมูลผู้ใช้เก็บผ่าน `usePersistent(key, default, validator)` (Dexie/IndexedDB, key-value) — คีย์ใหม่ต้องเพิ่มใน `KEY_RE` ของ `storage/db.ts` เพื่อให้ backup/restore รองรับ
- ดีไซน์: `design-system/stocklab-th/MASTER.md` (ui-ux-pro-max: Dark OLED, slate + green CTA) ปรับด้วย taste redesign-skill + emil-design-eng: ฟอนต์ IBM Plex Sans Thai/Mono, press scale 0.97, motion ≤ 200ms ease-out `--ease-out`, skeleton loading — สีหลักใช้ class `green-*`, ปุ่มหลักต้องใช้ตัวอักษรเข้มบนเขียว (contrast ≥ 4.5:1)
- Router เป็น HashRouter + `base: './'` เพื่อให้ GitHub Pages ใช้ได้ทุกชื่อ repo

## กฎที่ห้ามละเมิด
- ไม่มี look-ahead: indicator/pattern ที่แท่ง i ใช้ข้อมูล ≤ i; backtest ตัดสินใจที่ close แท่ง i แล้ว fill ที่ open แท่ง i+1; paper trade fill ที่แท่งถัดไปเท่านั้น
- warm-up/ค่าที่ไม่มีความหมาย = `null` / `N/A` พร้อมเหตุผล ห้ามใส่ 0
- ข้อมูลสังเคราะห์ต้องมีป้าย `ข้อมูลจำลอง (Synthetic/Demo)`; ห้ามสร้างข้อมูล "สด" ปลอม ห้ามต่อ broker/เงินจริง
- ห้ามข้อความเชิงชี้นำ ("ซื้อแน่", "กำไรชัวร์"); ค่าธรรมเนียม/กฎตลาดที่ใส่ต้องติดป้ายว่าเป็นสมมติฐานหรืออ้างแหล่งทางการพร้อมวันที่
- indicator ที่ยังไม่ implement ห้ามโผล่ใน `INDICATORS` (catalog = สิ่งที่ UI เปิดให้ใช้)
- ไฟล์ที่ผู้ใช้นำเข้าเป็นข้อมูลไม่น่าเชื่อถือ: validate ทุกครั้ง ห้าม eval
- TypeScript strict; ไม่ใช้ `any`/`@ts-ignore`; `eslint-disable` เฉพาะที่มีเหตุผลกำกับ
