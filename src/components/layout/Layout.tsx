import { Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV } from '../../app/nav';
import { useTheme } from '../../app/theme';

export function Layout() {
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const themeLabel = dark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด';

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-cyan-600 focus:px-3 focus:py-1 focus:text-white">ข้ามไปเนื้อหา</a>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/90">
        <button className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="sidebar" aria-label="เปิด/ปิดเมนู">{open ? <X size={18} /> : <Menu size={18} />}</button>
        <span className="font-bold">StockLab <span className="text-cyan-500">TH</span></span>
        <button className="btn" onClick={toggle} aria-label={themeLabel}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      </header>
      <aside id="sidebar" className={`${open ? 'block' : 'hidden'} fixed inset-x-0 bottom-0 top-[49px] z-20 overflow-y-auto border-r border-slate-200 bg-white p-3 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 dark:border-slate-800 dark:bg-slate-950`}>
        <div className="mb-4 hidden items-center justify-between lg:flex">
          <div>
            <div className="text-lg font-bold">StockLab <span className="text-cyan-500">TH</span></div>
            <div className="text-xs text-slate-500">Stock Academy & Market Simulator</div>
          </div>
          <button className="btn !p-1.5" onClick={toggle} aria-label={themeLabel}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
        </div>
        <nav aria-label="เมนูหลัก">
          {NAV.map((g) => (
            <div key={g.group} className="mb-3">
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.group}</div>
              <ul>
                {g.items.map(({ to, label, en, icon: Icon }) => (
                  <li key={to}>
                    <NavLink to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${isActive ? 'bg-cyan-50 font-semibold text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-slate-900'}`}>
                      <Icon size={16} aria-hidden /> <span>{label}</span><span className="ml-auto text-[10px] text-slate-400">{en}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <main id="main" className="mx-auto max-w-7xl p-4 lg:p-6"><Outlet /></main>
        <footer className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-4 text-xs text-slate-500 lg:px-6 dark:border-slate-800">
          <p><strong>เพื่อการศึกษาเท่านั้น</strong> — ไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล ไม่เชื่อมต่อโบรกเกอร์ และไม่มีการซื้อขายเงินจริง ราคา/งบการเงินในแอปเป็น <strong>ข้อมูลจำลอง</strong> ทั้งหมด ผลลัพธ์ในอดีตหรือจากการจำลองไม่รับประกันอนาคต</p>
          <p className="mt-1">ข้อมูลทั้งหมดเก็บในเบราว์เซอร์ของอุปกรณ์นี้ (ไม่มี login/cloud sync) · กราฟโดย <a className="underline" href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView Lightweight Charts™</a> (Apache-2.0)</p>
        </footer>
      </div>
    </div>
  );
}
