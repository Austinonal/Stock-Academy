import { BarChart3, Crosshair, Shapes, BookOpen, BookText, CandlestickChart, Database, FlaskConical, GraduationCap, LayoutDashboard, LineChart, Notebook, PieChart, Repeat, Search, Wallet, type LucideIcon } from 'lucide-react';

export type NavItem = { to: string; label: string; en: string; icon: LucideIcon };
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'เรียนรู้', items: [
    { to: '/', label: 'แดชบอร์ด', en: 'Dashboard', icon: LayoutDashboard },
    { to: '/learn', label: 'ห้องเรียน', en: 'Learning Path', icon: GraduationCap },
    { to: '/review', label: 'ทบทวนวันนี้', en: 'Review', icon: Repeat },
    { to: '/techniques', label: 'เทคนิคการเทรด', en: 'Techniques', icon: Crosshair },
    { to: '/glossary', label: 'คลังศัพท์', en: 'Glossary', icon: BookText },
  ] },
  { group: 'ห้องแล็บกราฟ', items: [
    { to: '/chart', label: 'ห้องฝึกกราฟ', en: 'Chart Playground', icon: CandlestickChart },
    { to: '/indicators', label: 'Indicator Lab', en: 'Indicators', icon: LineChart },
    { to: '/chart-patterns', label: 'รูปแบบกราฟ', en: 'Chart Patterns', icon: Shapes },
    { to: '/patterns', label: 'Pattern Lab', en: 'Candlesticks', icon: FlaskConical },
  ] },
  { group: 'วิเคราะห์ธุรกิจ', items: [
    { to: '/fundamentals', label: 'Fundamental Lab', en: 'Financials & Valuation', icon: BookOpen },
    { to: '/screener', label: 'คัดกรองหุ้น', en: 'Screener', icon: Search },
  ] },
  { group: 'จำลอง & ความเสี่ยง', items: [
    { to: '/paper', label: 'พอร์ตจำลอง', en: 'Paper Trading', icon: Wallet },
    { to: '/backtest', label: 'ทดสอบย้อนหลัง', en: 'Backtester', icon: BarChart3 },
    { to: '/risk', label: 'พอร์ต & ความเสี่ยง', en: 'Portfolio & Risk', icon: PieChart },
    { to: '/journal', label: 'บันทึกการลงทุน', en: 'Journal', icon: Notebook },
  ] },
  { group: 'ระบบ', items: [
    { to: '/data', label: 'ตั้งค่า & ข้อมูล', en: 'Settings / Data Center', icon: Database },
  ] },
];

