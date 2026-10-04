import type { RouteObject } from 'react-router';

import { RouteFallback } from '../RouteFallback';

/**
 * Rutas solo de desarrollo. En producción la lista queda vacía: `import.meta.env.DEV` es una
 * constante en el build, y Vite descarta la galería del bundle junto con el import dinámico.
 */
export const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/ui',
        HydrateFallback: RouteFallback,
        lazy: async () => {
          const { UiGallery } = await import('./UiGallery');
          return { Component: UiGallery };
        },
      },
      {
        path: '/dev/api',
        HydrateFallback: RouteFallback,
        lazy: async () => {
          const { ApiProbePage } = await import('./ApiProbePage');
          return { Component: ApiProbePage };
        },
      },
    ]
  : [];
