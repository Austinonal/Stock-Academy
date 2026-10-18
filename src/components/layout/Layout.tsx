import { CandlestickChart, Moon, Sun } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV } from '../../app/nav';
import { useTheme } from '../../app/theme';

const matches = (to: string, path: string) => (to === '/' ? path === '/' : path === to || path.startsWith(`${to}/`));
const groupOf = (path: string) => NAV.find((g) => g.items.some((i) => matches(i.to, path))) ?? NAV[0];

function Brand() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="StockLab TH หน้าแรก">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-500 text-slate-950 dark:shadow-[0_0_16px_rgba(34,197,94,.35)]" aria-hidden><CandlestickChart size={20} /></span>
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight">StockLab <span className="text-green-600 dark:text-green-400">TH</span></span>
        <span className="hidden text-[11px] text-slate-500 sm:block">Stock Academy & Simulator</span>
      </span>
    </Link>
  );
}

/** Two-tier top navigation: section tabs on top, that section's pages below. No sidebar. */
export function Layout() {
  const { dark, toggle } = useTheme();
  const { pathname } = useLocation();
  const group = groupOf(pathname);
  const themeLabel = dark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด';
  const ThemeIcon = dark ? Sun : Moon;

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-green-500 focus:px-3 focus:py-1.5 focus:font-semibold focus:text-slate-950">ข้ามไปเนื้อหา</a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-3 lg:px-8">
          <Brand />
          <nav aria-label="หมวดหลัก" className="order-last -mx-4 w-full overflow-x-auto px-4 md:order-none md:mx-0 md:w-auto md:flex-1 md:px-0">
            <ul className="flex gap-1">
              {NAV.map((g) => {
                const active = g === group;
                return (
                  <li key={g.group}>
                    <Link to={g.items[0].to} aria-current={active ? 'true' : undefined}
                      className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ${active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}>
                      {g.group}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <button className="btn ml-auto !px-2.5 md:ml-0" onClick={toggle} aria-label={themeLabel}><ThemeIcon size={18} /></button>
        </div>
        <nav aria-label={`หน้าในหมวด ${group.group}`} className="mx-auto max-w-7xl overflow-x-auto px-4 lg:px-8">
          <ul className="flex gap-1 pt-2">
            {group.items.map(({ to, label, en, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} end={to === '/'} title={en}
                  className={({ isActive }) => `relative flex items-center gap-2 whitespace-nowrap px-3 pb-2.5 pt-1.5 text-sm transition-colors duration-150 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full ${isActive || matches(to, pathname)
                    ? 'font-semibold text-slate-900 after:bg-green-500 dark:text-white'
                    : 'text-slate-600 after:bg-transparent hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
                  <Icon size={16} aria-hidden className="shrink-0" /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8"><Outlet /></main>
      <footer className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-5 text-xs leading-relaxed text-slate-500 lg:px-8 dark:border-slate-800">
        <p><strong className="text-slate-700 dark:text-slate-300">เพื่อการศึกษาเท่านั้น</strong> — ไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล ไม่เชื่อมต่อโบรกเกอร์ และไม่มีการซื้อขายเงินจริง ราคา/งบการเงินในแอปเป็น <strong className="text-slate-700 dark:text-slate-300">ข้อมูลจำลอง</strong> ทั้งหมด ผลลัพธ์ในอดีตหรือจากการจำลองไม่รับประกันอนาคต</p>
        <p className="mt-1">ข้อมูลทั้งหมดเก็บในเบราว์เซอร์ของอุปกรณ์นี้ (ไม่มี login/cloud sync) · กราฟโดย <a className="underline hover:text-slate-700 dark:hover:text-slate-300" href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView Lightweight Charts™</a> (Apache-2.0)</p>
      </footer>
    </div>
  );
}
