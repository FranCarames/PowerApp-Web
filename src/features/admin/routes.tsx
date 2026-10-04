import { redirect, type RouteObject } from 'react-router';

import { CatalogPage } from './pages/CatalogPage';
import { CoachesPage } from './pages/CoachesPage';
import { DashboardPage } from './pages/DashboardPage';

/** Pantallas del rol Admin, bajo /a. Van dentro de <AppShell> (lo arma el router). */
export const adminRoutes: RouteObject[] = [
  { index: true, loader: () => redirect('/a/inicio') },
  { path: 'inicio', Component: DashboardPage },
  { path: 'catalogo', Component: CatalogPage },
  { path: 'entrenadores', Component: CoachesPage },
];
