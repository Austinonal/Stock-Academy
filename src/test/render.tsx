import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../app/theme';

export function renderAt(path: string, routePath: string, el: ReactNode) {
  return render(<ThemeProvider><MemoryRouter initialEntries={[path]}><Routes><Route path={routePath} element={el} /></Routes></MemoryRouter></ThemeProvider>);
}
