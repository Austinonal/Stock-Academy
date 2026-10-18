import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Loading } from '../components/ui';

const Dashboard = lazy(() => import('../features/dashboard/DashboardPage'));
const Learn = lazy(() => import('../features/learning/LearnPage'));
const Lesson = lazy(() => import('../features/learning/LessonPage'));
const Review = lazy(() => import('../features/learning/ReviewPage'));
const Glossary = lazy(() => import('../features/glossary/GlossaryPage'));
const ChartPg = lazy(() => import('../features/chart-playground/ChartPage'));
const Indicators = lazy(() => import('../features/indicators/IndicatorLabPage'));
const ChartPatterns = lazy(() => import('../features/chart-patterns/ChartPatternsPage'));
const Techniques = lazy(() => import('../features/techniques/TechniquesPage'));
const Patterns = lazy(() => import('../features/candlestick-patterns/PatternLabPage'));
const Fundamentals = lazy(() => import('../features/fundamental-analysis/FundamentalPage'));
const Screener = lazy(() => import('../features/screener/ScreenerPage'));
const Paper = lazy(() => import('../features/paper-trading/PaperPage'));
const Backtest = lazy(() => import('../features/backtesting/BacktestPage'));
const Risk = lazy(() => import('../features/portfolio/RiskPage'));
const Journal = lazy(() => import('../features/journal/JournalPage'));
const Data = lazy(() => import('../features/settings/DataCenterPage'));

function Page({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}><Suspense fallback={<Loading />}>{children}</Suspense></ErrorBoundary>;
}

function NotFound() {
  return <div className="card"><h1 className="h1">ไม่พบหน้านี้</h1><a className="btn mt-3" href="#/">กลับแดชบอร์ด</a></div>;
}

const routes: [string, ReactNode][] = [
  ['/', <Dashboard />], ['/learn', <Learn />], ['/learn/:lessonId', <Lesson />], ['/review', <Review />], ['/glossary', <Glossary />], ['/techniques', <Techniques />], ['/chart-patterns', <ChartPatterns />],
  ['/chart', <ChartPg />], ['/indicators', <Indicators />], ['/patterns', <Patterns />], ['/fundamentals', <Fundamentals />],
  ['/screener', <Screener />], ['/paper', <Paper />], ['/backtest', <Backtest />], ['/risk', <Risk />], ['/journal', <Journal />], ['/data', <Data />],
  ['*', <NotFound />],
];

export const router = createHashRouter([{ element: <Layout />, children: routes.map(([path, el]) => ({ path, element: <Page>{el}</Page> })) }]);
