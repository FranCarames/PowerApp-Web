import { createBrowserRouter, redirect } from 'react-router';

import { devRoutes } from './dev/devRoutes';
import { Home } from './Home';
import { RouteFallback } from './RouteFallback';

// Provisorio hasta T04. En desarrollo, `/` lleva a la galería de componentes.
export const router = createBrowserRouter([
  ...devRoutes,
  {
    path: '/',
    loader: import.meta.env.DEV ? () => redirect('/dev/ui') : undefined,
    HydrateFallback: RouteFallback,
    Component: Home,
  },
  { path: '*', Component: Home },
]);
