import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const Ctx = createContext({ dark: true, toggle: () => {} });

function initial(): boolean {
  try { const v = localStorage.getItem('theme'); if (v) return v === 'dark'; } catch { /* storage blocked */ }
  return true; // default: dark professional
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(initial);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* storage blocked */ }
  }, [dark]);
  return <Ctx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
