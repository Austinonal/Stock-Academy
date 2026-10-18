import type { Level, Quiz } from './types';
import { SET_ANALYST, SET_BOOK, SET_EDU } from './levels0to3';

type OutlineDef = {
  level: number; title: string; en: string; difficulty: Level['difficulty']; tags: string[];
  objectives: string[]; sections: { h: string; points: string[] }[];
  tryIt?: { label: string; to: string }[]; quiz: Omit<Quiz, 'id'>[]; recap: string[]; caution?: string;
};

/** Levels 4–16: structured outlines (objectives + topic map + lab links + check questions). Full lesson text is the next content milestone. */
const DEFS: OutlineDef[] = [
  { level: 4, title: 'โครงสร้างตลาดและ Price Action', en: 'Market Structure & Price Action', difficulty: 'กลาง', tags: ['charting'],
    objectives: ['ระบุแนวโน้มด้วย HH/HL/LH/LL', 'วาดแนวรับ-แนวต้านเป็นโซน', 'อธิบาย breakout/false breakout และความเสี่ยงของการวาดย้อนหลัง'],
    sections: [
      { h: 'แนวโน้ม', points: ['Uptrend / Downtrend / Sideways', 'Higher High, Higher Low, Lower High, Lower Low', 'Dow Theory ในฐานะกรอบคิด ไม่ใช่กฎทำนาย'] },
      { h: 'แนวรับ–แนวต้าน', points: ['ทำไมควรมองเป็นโซน (Zone) ไม่ใช่เส้นเป๊ะ', 'Trendline, Channel', 'Breakout, Breakdown, Retest, False Breakout'] },
      { h: 'Chart Patterns', points: ['Head & Shoulders / Inverse', 'Double Top / Double Bottom', 'Triangles, Flags, Pennants, Wedges, Rectangles, Cup & Handle', 'Continuation vs Reversal', 'Volatility contraction / expansion'] },
      { h: 'ข้อควรระวัง', points: ['Multi-timeframe context', 'การวาดย้อนหลังให้ดูแม่น (hindsight)', 'ทุกรูปแบบต้องมีเงื่อนไขที่ถือว่าผิด'] },
    ],
    tryIt: [{ label: 'วาดเส้นแนวโน้ม/โซนใน Chart Playground', to: '/chart' }, { label: 'ฝึกด้วย Chart Replay', to: '/chart' }],
    quiz: [
      { q: 'ลำดับ Higher High และ Higher Low บ่งบอกโครงสร้างแบบใด?', choices: ['ขาขึ้น', 'ขาลง', 'Sideways', 'ไม่มีความหมาย'], answer: 0, why: ['ถูก', 'ขาลงคือ LH/LL', 'sideways ไม่มี HH/HL ต่อเนื่อง', 'มีความหมายเชิงโครงสร้าง'] },
      { q: 'ทำไมจึงควรมองแนวรับเป็น "โซน"?', choices: ['เพราะผู้ร่วมตลาดตัดสินใจที่ราคาใกล้เคียงกันไม่ใช่ราคาเดียว', 'เพราะกฎตลาด', 'เพราะกราฟวาดไม่ได้', 'ไม่ควร'], answer: 0, why: ['ถูก', 'ไม่ใช่', 'ไม่ใช่', 'ควร'] },
    ],
    recap: ['โครงสร้าง HH/HL vs LH/LL', 'แนวรับ–ต้านคือโซน', 'false breakout เกิดได้บ่อย'] },
  { level: 5, title: 'Technical Indicators', en: 'Technical Indicators', difficulty: 'กลาง', tags: ['indicators'],
    objectives: ['อธิบายสูตรและ warm-up ของ indicator หลัก', 'ปรับ parameter แล้วอธิบายผลต่อความไว', 'ระบุการตีความผิดที่พบบ่อย'],
    sections: [
      { h: 'Trend', points: ['SMA, EMA, WMA, VWMA', 'MACD (line, signal, histogram)', 'ADX, +DI, −DI', 'ยังไม่ implement: Ichimoku, Parabolic SAR, Supertrend'] },
      { h: 'Momentum', points: ['RSI (Wilder)', 'Stochastic %K/%D', 'ROC', 'CCI', 'Williams %R', 'ยังไม่ implement: Stochastic RSI'] },
      { h: 'Volatility', points: ['Bollinger Bands (%B, bandwidth)', 'ATR', 'Keltner Channels', 'Donchian Channels'] },
      { h: 'Volume', points: ['Volume SMA', 'OBV', 'Accumulation/Distribution', 'Chaikin Money Flow', 'MFI', 'VWAP ต้องใช้ข้อมูล intraday — ยังไม่รองรับ'] },
      { h: 'Levels', points: ['Pivot Points (สูตร classic floor)', 'Fibonacci retracement เป็นเครื่องมืออ้างอิง ไม่ใช่ตัวเลขวิเศษ'] },
    ],
    tryIt: [{ label: 'เปิด Indicator Lab', to: '/indicators' }],
    quiz: [
      { q: 'ทำไม indicator จึงคืนค่าว่าง (null) ในช่วงต้นของข้อมูล?', choices: ['เพราะ bug', 'เพราะยังมีข้อมูลไม่ครบตาม period (warm-up)', 'เพราะราคาเป็นศูนย์', 'เพราะตลาดปิด'], answer: 1, why: ['ไม่ใช่ bug', 'ถูก', 'ไม่ใช่', 'ไม่ใช่'] },
      { q: 'RSI เกิน 70 หมายความว่าอย่างไร?', choices: ['ราคาจะลงแน่', 'แรงส่งขาขึ้นสูงเมื่อเทียบกับช่วงที่ผ่านมา — ไม่ใช่สัญญาณกลับตัวในตัวเอง', 'ต้องขายทันที', 'ข้อมูลผิด'], answer: 1, why: ['ไม่มีอะไรแน่', 'ถูก', 'ไม่ใช่คำแนะนำ', 'ไม่ใช่'] },
    ],
    recap: ['indicator ทุกตัวมาจากราคา/volume ในอดีต', 'warm-up ต้องเป็น null ไม่ใช่ 0', 'หลาย indicator ตรงกันไม่ได้รับประกันสัญญาณ'] },
  { level: 6, title: 'Volume, Market Breadth และ Microstructure', en: 'Volume & Microstructure', difficulty: 'กลาง', tags: ['order mechanics'],
    objectives: ['แยก volume กับ value traded', 'อธิบาย liquidity, spread, slippage, market impact', 'อธิบาย market breadth ในระดับแนวคิด'],
    sections: [
      { h: 'Volume', points: ['Volume vs Value traded (turnover)', 'Volume confirmation / divergence อย่างระมัดระวัง'] },
      { h: 'Microstructure', points: ['Liquidity, spread, slippage, market impact', 'Order book, bid/ask imbalance (แนวคิด)', 'พฤติกรรม market/limit/stop และ gap risk'] },
      { h: 'Breadth', points: ['Advance/Decline', 'การเทียบกับ benchmark'] },
      { h: 'กฎเฉพาะตลาด', points: ['tick size / lot size / session rules — ต้องตรวจจากแหล่งทางการพร้อมวันที่'] },
    ],
    tryIt: [{ label: 'ทดลอง slippage ใน Backtester', to: '/backtest' }],
    quiz: [
      { q: 'Market impact คืออะไร?', choices: ['ข่าวเศรษฐกิจ', 'การที่คำสั่งขนาดใหญ่ของเราทำให้ราคาเคลื่อนไปในทางที่เสียเปรียบ', 'ค่าธรรมเนียม', 'ภาษี'], answer: 1, why: ['ไม่ใช่', 'ถูก', 'ไม่ใช่', 'ไม่ใช่'] },
      { q: 'Value traded ต่างจาก volume อย่างไร?', choices: ['เหมือนกัน', 'value = จำนวนหุ้น × ราคา', 'value = จำนวนรายการ', 'value = จำนวนผู้ซื้อ'], answer: 1, why: ['ไม่เหมือน', 'ถูก', 'ไม่ใช่', 'ไม่ใช่'] },
    ],
    recap: ['สภาพคล่องคือต้นทุนแฝง', 'คำสั่งใหญ่กระทบราคา', 'กฎตลาดต้องตรวจจากแหล่งทางการ'] },
  { level: 7, title: 'การวิเคราะห์ปัจจัยพื้นฐาน', en: 'Fundamental Analysis', difficulty: 'กลาง', tags: ['fundamentals'],
    objectives: ['อ่านงบกำไรขาดทุน งบดุล งบกระแสเงินสด', 'คำนวณ margin, ROE, ROA, ROIC, D/E, current ratio', 'แยกกำไรจากรายการพิเศษ'],
    sections: [
      { h: 'ธุรกิจ', points: ['Business model, moat, market share', 'การบริหาร ความเสี่ยง ธรรมาภิบาล dilution'] },
      { h: 'งบการเงิน', points: ['Income Statement: รายได้ ต้นทุน กำไรขั้นต้น/ดำเนินงาน/สุทธิ EPS, diluted EPS', 'Balance Sheet: สินทรัพย์ หนี้สิน ส่วนของผู้ถือหุ้น working capital', 'Cash Flow: CFO, capex, FCF', 'Accrual vs cash, one-off items, quality of earnings, หมายเหตุประกอบงบ'] },
      { h: 'อัตราส่วน', points: ['ROE, ROA, ROIC, gross/operating/net margin', 'Current, quick, D/E, interest coverage', 'Dividend yield, payout ratio', 'CAGR'] },
      { h: 'ข้อควรระวัง', points: ['เทียบในอุตสาหกรรมเดียวกัน — ธนาคารใช้เกณฑ์ต่างจากธุรกิจทั่วไป'] },
    ],
    tryIt: [{ label: 'คำนวณ ratio ของบริษัทสมมติใน Fundamental Lab', to: '/fundamentals' }],
    quiz: [
      { q: 'กำไรสุทธิ 100 ล้าน มีรายการพิเศษกำไรจากขายที่ดิน 40 ล้าน (ก่อนภาษี 20%) กำไรจากธุรกิจปกติประมาณเท่าไร?', choices: ['100', '68', '60', '140'], answer: 1, why: ['ยังรวมรายการพิเศษ', 'ถูก: 100 − 40×0.8', 'ลืมผลภาษี', 'ผิดทิศ'] },
      { q: 'ทำไมไม่ควรเทียบ D/E ของธนาคารกับบริษัทอุตสาหกรรม?', choices: ['ธนาคารไม่มีหนี้', 'หนี้สิน (เงินฝาก) เป็นวัตถุดิบของธุรกิจธนาคาร โครงสร้างต่างกัน', 'กฎหมายห้าม', 'ธนาคารไม่มีส่วนของผู้ถือหุ้น'], answer: 1, why: ['ธนาคารมีหนี้มาก', 'ถูก', 'ไม่ใช่', 'มี'] },
    ],
    recap: ['อ่านงบทั้งสามประกอบกัน', 'แยกกำไรปกติกับรายการพิเศษ', 'เทียบกับคู่แข่งในอุตสาหกรรมเดียวกัน'] },
  { level: 8, title: 'การประเมินมูลค่า', en: 'Valuation', difficulty: 'สูง', tags: ['valuation'],
    objectives: ['ใช้ P/E, P/B, EV/EBITDA อย่างเข้าใจข้อจำกัด', 'สร้าง DCF และ sensitivity table', 'อธิบาย margin of safety'],
    sections: [
      { h: 'Relative', points: ['ราคาตลาด vs มูลค่าประเมิน', 'P/E, P/B, EV/EBITDA comparable และข้อจำกัด'] },
      { h: 'Intrinsic', points: ['DCF: FCF, discount rate, horizon, terminal value', 'Dividend Discount Model', 'Asset-based (แนวคิด)'] },
      { h: 'ความไม่แน่นอน', points: ['Sensitivity และ scenario (bear/base/bull เป็นสมมติฐาน)', 'ความไวต่อ growth, margin, discount rate, terminal', 'ความแม่นยำปลอม (false precision)', 'Margin of safety'] },
    ],
    tryIt: [{ label: 'ใช้ DCF calculator + sensitivity ใน Fundamental Lab', to: '/fundamentals' }],
    quiz: [
      { q: 'ถ้า discount rate เพิ่มขึ้น มูลค่า DCF จะเป็นอย่างไร (สมมติอื่นคงที่)?', choices: ['เพิ่ม', 'ลด', 'เท่าเดิม', 'คาดเดาไม่ได้'], answer: 1, why: ['ผิดทิศ', 'ถูก: กระแสเงินสดอนาคตถูกคิดลดมากขึ้น', 'ไม่ใช่', 'ทิศทางชัดเจน'] },
      { q: 'ทำไม DCF ต้องการ discount rate > terminal growth?', choices: ['เป็นธรรมเนียม', 'ไม่เช่นนั้นสูตร terminal value ให้ค่าอนันต์หรือติดลบ', 'กฎหมายกำหนด', 'ไม่จำเป็น'], answer: 1, why: ['เป็นข้อจำกัดทางคณิตศาสตร์', 'ถูก', 'ไม่ใช่', 'จำเป็น'] },
    ],
    recap: ['มูลค่าประเมินขึ้นกับสมมติฐาน', 'terminal value มักเป็นสัดส่วนใหญ่ของ DCF', 'ทำ sensitivity เสมอ'] },
  { level: 9, title: 'เศรษฐกิจมหภาคและอุตสาหกรรม', en: 'Macro & Industry', difficulty: 'กลาง', tags: ['macro'],
    objectives: ['อธิบายตัวแปรมหภาคหลักและช่องทางที่กระทบธุรกิจ', 'แยกความสัมพันธ์กับเหตุและผล'],
    sections: [
      { h: 'ตัวแปรมหภาค', points: ['GDP, เงินเฟ้อ, ดอกเบี้ยนโยบาย, yield curve', 'ธนาคารกลาง นโยบายการเงิน/การคลัง', 'ค่าเงิน ราคาสินค้าโภคภัณฑ์ ต้นทุนเงินทุน'] },
      { h: 'วัฏจักร', points: ['วัฏจักรเศรษฐกิจกับผลต่ออุตสาหกรรมต่างกัน', 'Earnings season, surprise, guidance', 'Industry lifecycle, regulation, competition, disruption'] },
      { h: 'การคิด', points: ['Correlation ≠ causation', 'แยกข้อมูลย้อนหลัง ข่าวปัจจุบัน และ scenario'] },
    ],
    quiz: [
      { q: 'ดอกเบี้ยสูงขึ้นโดยทั่วไปกระทบมูลค่าหุ้นผ่านช่องทางใด?', choices: ['ไม่มีผล', 'อัตราคิดลดสูงขึ้นและต้นทุนการกู้ยืมสูงขึ้น', 'กำไรเพิ่มทุกบริษัท', 'จำนวนหุ้นลดลง'], answer: 1, why: ['มีผล', 'ถูก', 'ไม่ใช่ทุกบริษัท', 'ไม่เกี่ยว'] },
      { q: 'ตัวแปร A กับราคาหุ้นเคลื่อนไหวไปด้วยกัน สรุปได้หรือไม่ว่า A เป็นสาเหตุ?', choices: ['ได้', 'ไม่ได้ — ความสัมพันธ์ไม่เท่ากับเหตุและผล', 'ได้ถ้าข้อมูลมาก', 'ได้ถ้าเป็นข่าว'], answer: 1, why: ['ผิด', 'ถูก', 'ข้อมูลมากก็ยังไม่พิสูจน์เหตุผล', 'ไม่ใช่'] },
    ],
    recap: ['มหภาคกระทบผ่านต้นทุนเงินทุนและอุปสงค์', 'อุตสาหกรรมตอบสนองต่างกัน', 'correlation ≠ causation'] },
  { level: 10, title: 'Corporate Actions และเหตุการณ์สำคัญ', en: 'Corporate Actions', difficulty: 'กลาง', tags: ['basics'],
    objectives: ['อธิบายผลของปันผล split rights warrant buyback ต่อผู้ถือหุ้น', 'เข้าใจ adjusted vs unadjusted price และผลต่อ backtest'],
    sections: [
      { h: 'เหตุการณ์', points: ['เงินปันผลและวันที่เกี่ยวข้อง (แนวคิด)', 'Stock split / reverse split', 'Rights offering, warrant, dilution', 'Buyback, M&A, spin-off, capital raising'] },
      { h: 'ข้อมูล', points: ['Adjusted vs unadjusted price และผลต่อ backtest', 'Halt, suspension, event risk — กฎจริงตรวจจากตลาด/หน่วยงานทางการ'] },
    ],
    quiz: [
      { q: 'หุ้นราคา 100 บาท แตกพาร์ 1:2 ราคาหลัง split ในทางทฤษฎีประมาณเท่าไร?', choices: ['100', '50', '200', '25'], answer: 1, why: ['ราคาต้องปรับ', 'ถูก: มูลค่ารวมเท่าเดิม จำนวนหุ้น 2 เท่า', 'ผิดทิศ', 'ผิด'] },
      { q: 'ทำไม backtest ด้วยราคา unadjusted อาจผิดพลาด?', choices: ['ไม่ผิด', 'split/ปันผลทำให้ราคากระโดดเทียมจนเกิดสัญญาณหลอก', 'เพราะช้า', 'เพราะผิดกฎหมาย'], answer: 1, why: ['ผิด', 'ถูก', 'ไม่ใช่', 'ไม่ใช่'] },
    ],
    recap: ['split ไม่เปลี่ยนมูลค่ารวม', 'เพิ่มทุนอาจ dilute', 'ใช้ราคาที่ปรับแล้วใน backtest'], caution: 'ข้อมูลจำลองในแอปนี้ไม่มี corporate actions' },
  { level: 11, title: 'การสร้างพอร์ตและการบริหารความเสี่ยง', en: 'Portfolio & Risk Management', difficulty: 'สูง', tags: ['portfolio', 'risk'],
    objectives: ['คำนวณ volatility, correlation, drawdown', 'ใช้ position sizing จากความเสี่ยงที่สมมติ', 'อธิบาย expectancy และ risk of ruin'],
    sections: [
      { h: 'พอร์ต', points: ['Risk–return, diversification, concentration, sector exposure', 'Covariance, correlation, volatility, beta', 'Asset allocation และ rebalancing (เชิงการศึกษา)'] },
      { h: 'ต่อไม้', points: ['Position sizing จากความเสี่ยงต่อไม้', 'Risk/reward, expected value, expectancy', 'Stop-loss และ gap risk'] },
      { h: 'ระยะยาว', points: ['Drawdown, recovery math, sequence of returns', 'Risk of ruin (simulation)', 'Leverage risk และต้นทุนดอกเบี้ย', 'ความเสี่ยงจากข้อมูลน้อยหรือเชื่อ correlation มากเกินไป'] },
    ],
    tryIt: [{ label: 'Portfolio & Risk Lab', to: '/risk' }],
    quiz: [
      { q: 'พอร์ต 100,000 ยอมเสี่ยง 1% ต่อไม้ ซื้อที่ 50 จุดที่สมมติฐานผิดอยู่ที่ 45 ควรซื้อกี่หุ้นตามคณิตศาสตร์นี้?', choices: ['100', '200', '2,000', '1,000'], answer: 1, why: ['เสี่ยง 500 ไม่ใช่ 1,000', 'ถูก: 1,000 / 5 = 200', 'มากเกินไป', 'ผิด'] },
      { q: 'สินทรัพย์ 2 ตัว correlation = 1 การกระจายระหว่างสองตัวช่วยลดความผันผวนหรือไม่?', choices: ['ช่วยมาก', 'แทบไม่ช่วย', 'ช่วยเสมอ', 'เพิ่มผลตอบแทน'], answer: 1, why: ['ไม่ใช่', 'ถูก', 'ไม่จริง', 'ไม่เกี่ยว'] },
    ],
    recap: ['คุมความเสี่ยงต่อไม้', 'drawdown ลึกต้องใช้กำไรมากเพื่อกลับ', 'correlation เปลี่ยนได้ในช่วงวิกฤต'] },
  { level: 12, title: 'การคิดเชิงปริมาณและสถิติ', en: 'Quantitative Thinking', difficulty: 'สูง', tags: ['quantitative'],
    objectives: ['ใช้สถิติพื้นฐานกับผลตอบแทน', 'ระบุ bias ทางสถิติ', 'ตีความ p-value และ Monte Carlo อย่างถูกต้อง'],
    sections: [
      { h: 'สถิติพื้นฐาน', points: ['ค่าเฉลี่ย มัธยฐาน ความแปรปรวน SD', 'Probability, conditional probability, base rates', 'Distributions, outliers, fat tails'] },
      { h: 'Bias', points: ['Correlation vs causation', 'Sampling, selection bias, survivorship bias'] },
      { h: 'โมเดล', points: ['Regression และข้อจำกัด', 'Hypothesis testing, CI, p-value', 'Return distribution ไม่ปกติ', 'Monte Carlo เพื่อดูช่วงผลลัพธ์'] },
    ],
    tryIt: [{ label: 'Monte Carlo ลำดับผลตอบแทนใน Risk Lab', to: '/risk' }],
    quiz: [
      { q: 'Survivorship bias ใน backtest หมายถึงอะไร?', choices: ['ใช้ข้อมูลเฉพาะบริษัทที่ยังอยู่รอด ทำให้ผลดูดีเกินจริง', 'ใช้ข้อมูลมากเกินไป', 'ใช้ค่าธรรมเนียมสูง', 'ใช้ timeframe ใหญ่'], answer: 0, why: ['ถูก', 'ไม่ใช่', 'ไม่ใช่', 'ไม่ใช่'] },
      { q: 'p-value 0.04 หมายความว่า?', choices: ['กลยุทธ์ได้ผลแน่ 96%', 'ถ้าไม่มีผลจริง โอกาสเห็นผลแรงเท่านี้หรือมากกว่าราว 4%', 'ขาดทุน 4%', 'ผิดพลาด 4%'], answer: 1, why: ['เป็นการตีความผิดที่พบบ่อย', 'ถูก', 'ไม่เกี่ยว', 'ไม่ใช่'] },
    ],
    recap: ['ผลตอบแทนตลาดมี fat tails', 'ระวัง bias ในข้อมูล', 'p-value ไม่ใช่ความน่าจะเป็นที่สมมติฐานถูก'] },
  { level: 13, title: 'วิจัยกลยุทธ์และ Backtesting', en: 'Strategy Research & Backtesting', difficulty: 'สูง', tags: ['quantitative'],
    objectives: ['แปลงไอเดียเป็นกฎที่ทดสอบได้', 'ป้องกัน look-ahead bias และ overfitting', 'อ่าน metrics อย่างวิจารณ์'],
    sections: [
      { h: 'ออกแบบ', points: ['กำหนด entry, exit, sizing, fees, slippage ก่อนทดสอบ', 'Baseline/benchmark'] },
      { h: 'Validation', points: ['In-sample / out-of-sample', 'Walk-forward', 'Look-ahead bias, data leakage, survivorship, selection bias', 'Overfitting, multiple testing, data snooping', 'Regime change, robustness, sensitivity'] },
      { h: 'Metrics', points: ['Max drawdown, CAGR, volatility, Sharpe/Sortino (ระบุสมมติฐาน)', 'Win rate, profit factor, expectancy, avg win/loss, exposure, trades', 'ผลลัพธ์ที่น่าดึงดูดแต่ไม่น่าเชื่อถือ'] },
    ],
    tryIt: [{ label: 'Backtester พร้อม in/out-of-sample split', to: '/backtest' }],
    quiz: [
      { q: 'ตัดสินใจที่ราคาปิดวันนี้ แล้วสมมติว่าซื้อได้ที่ราคาปิดเดียวกัน มีปัญหาอะไร?', choices: ['ไม่มี', 'ใช้ข้อมูลที่เพิ่งรู้แล้ว fill ทันทีอาจไม่สมจริง — ควร fill แท่งถัดไปหรือระบุสมมติฐาน', 'ค่าธรรมเนียมสูง', 'ผิดกฎหมาย'], answer: 1, why: ['มีปัญหา', 'ถูก', 'ไม่ใช่ประเด็น', 'ไม่ใช่'] },
      { q: 'ทดลอง 200 ชุดพารามิเตอร์แล้วเลือกตัวที่ดีที่สุด เสี่ยงต่อปัญหาใด?', choices: ['Overfitting / data snooping', 'Survivorship', 'Gap risk', 'ไม่มี'], answer: 0, why: ['ถูก', 'ไม่ใช่หลัก', 'ไม่ใช่', 'มี'] },
    ],
    recap: ['กำหนดกติกาก่อนดูผล', 'ทดสอบนอกตัวอย่าง', 'หักต้นทุนเสมอ'] },
  { level: 14, title: 'การเงินเชิงพฤติกรรมและจิตวิทยา', en: 'Behavioral Finance', difficulty: 'กลาง', tags: ['behavioral finance'],
    objectives: ['ระบุ bias ที่พบบ่อยในตนเอง', 'แยก process กับ outcome', 'ใช้ checklist และ journal'],
    sections: [
      { h: 'Bias', points: ['Loss aversion, anchoring, confirmation bias, recency bias', 'FOMO, overconfidence, sunk cost, disposition effect', 'Revenge trading'] },
      { h: 'กระบวนการ', points: ['Process vs outcome', 'Checklist และ journal', 'กำหนดกติกาก่อนเห็นผล และบันทึกเหตุผลที่อาจผิด'] },
    ],
    tryIt: [{ label: 'เขียน Journal พร้อมเงื่อนไขที่ thesis ผิด', to: '/journal' }],
    quiz: [
      { q: 'ถือหุ้นที่ขาดทุนไว้นานเพราะไม่อยากรับรู้ขาดทุน แต่รีบขายหุ้นที่กำไร คือ bias ใด?', choices: ['Disposition effect', 'Anchoring', 'FOMO', 'Recency'], answer: 0, why: ['ถูก', 'ไม่ใช่หลัก', 'ไม่ใช่', 'ไม่ใช่'] },
      { q: 'ผลกำไรครั้งเดียวพิสูจน์ว่าการตัดสินใจดีหรือไม่?', choices: ['พิสูจน์ได้', 'ไม่ได้ — ต้องประเมินกระบวนการ ผลลัพธ์มีโชคปน', 'ได้ถ้ากำไรมาก', 'ได้ถ้าเร็ว'], answer: 1, why: ['ผิด', 'ถูก', 'ผิด', 'ผิด'] },
    ],
    recap: ['bias มีในทุกคน', 'ประเมิน process ไม่ใช่แค่ผลลัพธ์', 'journal ช่วยให้เห็นรูปแบบความผิดพลาด'] },
  { level: 15, title: 'การวิจัยขั้นสูงระดับมืออาชีพ', en: 'Professional Research', difficulty: 'สูง', tags: ['valuation', 'portfolio'],
    objectives: ['เขียน investment thesis พร้อม variant view และ catalyst', 'วางโครงรายงานวิจัย', 'อธิบาย factor และ attribution'],
    sections: [
      { h: 'Thesis', points: ['Thesis, variant view, catalyst', 'โครงรายงาน: summary, thesis, evidence, risks, valuation, scenarios, invalidation', 'Peer comparison และคุณภาพข้อมูล'] },
      { h: 'Portfolio', points: ['Factor investing: value, quality, momentum, low vol และข้อจำกัด', 'Market regimes, attribution, benchmark-relative performance'] },
      { h: 'สินทรัพย์อื่น', points: ['ETF, REIT, bond และอนุพันธ์ในระดับความเสี่ยง (leverage, expiry, loss) — ไม่มีส่วนซื้อขายจริง', 'ภาพรวมตลาดไทยและต่างประเทศ — กฎ/ภาษีอ้างหน่วยงานทางการ'] },
    ],
    quiz: [
      { q: 'Variant view คืออะไร?', choices: ['มุมมองเดียวกับตลาด', 'มุมมองที่ต่างจากฉันทามติตลาดพร้อมเหตุผลและหลักฐาน', 'ข่าวลือ', 'ราคาเป้าหมาย'], answer: 1, why: ['ไม่ใช่', 'ถูก', 'ไม่ใช่', 'ไม่ใช่'] },
      { q: 'อนุพันธ์มีความเสี่ยงสำคัญใดที่หุ้นทั่วไปไม่มี?', choices: ['ไม่มี', 'Leverage และวันหมดอายุ ทำให้ขาดทุนเร็วหรือเกินเงินต้นได้ในบางสัญญา', 'ภาษีสูงกว่าเสมอ', 'ซื้อไม่ได้'], answer: 1, why: ['มี', 'ถูก', 'ไม่ใช่ประเด็นหลัก', 'ไม่ใช่'] },
    ],
    recap: ['thesis ต้องมี invalidation', 'factor มีช่วงที่แพ้ตลาด', 'อนุพันธ์มี leverage'] },
  { level: 16, title: 'Capstone — โปรเจกต์จบหลักสูตร', en: 'Capstone', difficulty: 'สูง', tags: ['capstone'],
    objectives: ['บูรณาการทักษะทั้งหลักสูตรเป็นรายงานหนึ่งชิ้น'],
    sections: [
      { h: 'ขั้นตอน', points: ['1) อธิบายธุรกิจจากข้อมูลที่ให้ (Fundamental Lab)', '2) คำนวณ financial ratios', '3) ประเมินมูลค่าอย่างน้อยหนึ่งวิธี + sensitivity', '4) วิเคราะห์แนวโน้ม/กราฟพร้อมความไม่แน่นอน', '5) Risk plan + thesis + เงื่อนไขที่ thesis ผิด (Journal)', '6) ทดสอบกฎกลยุทธ์โดยหักค่าธรรมเนียม/slippage (Backtester)', '7) Post-mortem: ข้อจำกัดและข้อมูลที่ยังขาด'] },
      { h: 'เกณฑ์ประเมินตนเอง', points: ['คุณภาพการให้เหตุผลและหลักฐาน', 'ความถูกต้องของการคำนวณ', 'ความเข้าใจความเสี่ยง', 'ไม่ให้คะแนนจากการ "ทายถูก" ย้อนหลัง'] },
    ],
    tryIt: [{ label: 'เริ่มจาก Fundamental Lab', to: '/fundamentals' }, { label: 'บันทึกใน Journal', to: '/journal' }],
    quiz: [
      { q: 'เกณฑ์ใดไม่ควรใช้ให้คะแนน capstone?', choices: ['คุณภาพเหตุผล', 'การคำนวณถูกต้อง', 'การทายทิศทางราคาถูกจากข้อมูลย้อนหลัง', 'ความเข้าใจความเสี่ยง'], answer: 2, why: ['ควรใช้', 'ควรใช้', 'ถูก: เป็นผลลัพธ์ที่มีโชคปน', 'ควรใช้'] },
      { q: 'Post-mortem ควรมีอะไร?', choices: ['เฉพาะสิ่งที่ถูก', 'ข้อจำกัด สิ่งที่ผิด และข้อมูลที่ยังขาด', 'ราคาเป้าหมายใหม่', 'ไม่จำเป็น'], answer: 1, why: ['ไม่ครบ', 'ถูก', 'ไม่ใช่หลัก', 'จำเป็น'] },
    ],
    recap: ['บูรณาการทุกทักษะ', 'เน้นกระบวนการและหลักฐาน', 'ยอมรับข้อจำกัด'] },
];

export const OUTLINE_LEVELS: Level[] = DEFS.map((d) => ({
  id: `L${d.level}`, level: d.level, title: d.title, en: d.en, difficulty: d.difficulty, prerequisites: [`L${d.level - 1}`], objectives: d.objectives, tags: d.tags,
  lessons: [{
    id: `l${d.level}-outline`, title: `ภาพรวม: ${d.title}`, minutes: 10, outline: true,
    summary: `โครงร่างหัวข้อของ Level ${d.level} พร้อมแบบทดสอบความเข้าใจ เนื้อหาบทเรียนเต็มอยู่ในแผนพัฒนาถัดไป`,
    prerequisites: [], objectives: d.objectives,
    blocks: [...d.sections.map((s) => ({ h: s.h, list: s.points })), ...(d.caution ? [{ note: d.caution }] : [])],
    tryIt: d.tryIt, mistakes: [],
    quiz: d.quiz.map((q, i) => ({ ...q, id: `q-l${d.level}-${i + 1}` })),
    flashcards: [],
    recap: d.recap,
    refs: d.level >= 7 ? [SET_ANALYST, SET_BOOK] : [SET_EDU],
  }],
}));
