import { CandlestickChart, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV } from '../../app/nav';
import { useTheme } from '../../app/theme';

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-500 text-slate-950 dark:shadow-[0_0_16px_rgba(34,197,94,.35)]" aria-hidden><CandlestickChart size={20} /></span>
      <div className="leading-tight">
        <div className="text-base font-bold tracking-tight">StockLab <span className="text-green-600 dark:text-green-400">TH</span></div>
        <div className="text-[11px] text-slate-500">Stock Academy & Simulator</div>
      </div>
    </div>
  );
}

export function Layout() {
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const themeLabel = dark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด';
  const ThemeIcon = dark ? Sun : Moon;

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-green-500 focus:px-3 focus:py-1.5 focus:font-semibold focus:text-slate-950">ข้ามไปเนื้อหา</a>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/85 px-3 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/85">
        <button className="btn !px-2.5" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="sidebar" aria-label="เปิด/ปิดเมนู">{open ? <X size={18} /> : <Menu size={18} />}</button>
        <Brand />
        <button className="btn !px-2.5" onClick={toggle} aria-label={themeLabel}><ThemeIcon size={18} /></button>
      </header>
      <aside id="sidebar" className={`${open ? 'flex' : 'hidden'} fixed inset-x-0 bottom-0 top-[53px] z-20 flex-col overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-68 lg:shrink-0 dark:border-slate-800 dark:bg-slate-900`}>
        <div className="mb-6 hidden px-2 lg:block"><Brand /></div>
        <nav aria-label="เมนูหลัก" className="flex-1">
          {NAV.map((g) => (
            <div key={g.group} className="mb-5">
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.group}</div>
              <ul className="space-y-0.5">
                {g.items.map(({ to, label, en, icon: Icon }) => (
                  <li key={to}>
                    <NavLink to={to} end={to === '/'} className={({ isActive }) => `group relative flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 ${isActive
                      ? 'bg-green-50 font-semibold text-green-800 before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-green-500 dark:bg-green-500/10 dark:text-green-300'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'}`}>
                      <Icon size={17} aria-hidden className="shrink-0" />
                      <span className="flex-1">{label}</span>
                      <span className="text-[10px] text-slate-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100">{en}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <button className="btn mt-2 hidden justify-center lg:flex" onClick={toggle} aria-label={themeLabel}><ThemeIcon size={16} /> {dark ? 'ธีมสว่าง' : 'ธีมมืด'}</button>
      </aside>
      <div className="min-w-0 flex-1">
        <main id="main" className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8"><Outlet /></main>
        <footer className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-5 text-xs leading-relaxed text-slate-500 lg:px-8 dark:border-slate-800">
          <p><strong className="text-slate-700 dark:text-slate-300">เพื่อการศึกษาเท่านั้น</strong> — ไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล ไม่เชื่อมต่อโบรกเกอร์ และไม่มีการซื้อขายเงินจริง ราคา/งบการเงินในแอปเป็น <strong className="text-slate-700 dark:text-slate-300">ข้อมูลจำลอง</strong> ทั้งหมด ผลลัพธ์ในอดีตหรือจากการจำลองไม่รับประกันอนาคต</p>
          <p className="mt-1">ข้อมูลทั้งหมดเก็บในเบราว์เซอร์ของอุปกรณ์นี้ (ไม่มี login/cloud sync) · กราฟโดย <a className="underline hover:text-slate-700 dark:hover:text-slate-300" href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView Lightweight Charts™</a> (Apache-2.0)</p>
        </footer>
      </div>
    </div>
  );
}
