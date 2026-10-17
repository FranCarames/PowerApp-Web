import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * Las opciones de la query de `GET /routine/all-plus`: las rutinas con sus circuitos, ordenadas por
 * nombre. Con `includeInactive` trae también las dadas de baja, que el backend deja afuera si no. Es de
 * entrenador y admin.
 */
export function routinesPlusQuery(includeInactive: boolean) {
  return queryOptions({
    queryKey: queryKeys.routines.listPlus(includeInactive),
    queryFn: ({ signal }) =>
      api.get('/api/v1/routine/all-plus', {
        // Sin el parámetro, el backend trae solo las vigentes: `false` no se manda.
        query: includeInactive ? { include_inactive: true } : undefined,
        signal,
      }),
  });
}

/**
 * `GET /routine/all-plus`: cada rutina con su nota del entrenador, su estado y sus circuitos en orden
 * (el `id` del vínculo, el `order` y el `id`, nombre, tipo y estado del circuito). **No trae los
 * ejercicios**: para contarlos hay que cruzar con los circuitos (`useCircuits`). Los usa el listado de
 * rutinas (`RoutineList`), el del Admin (T21) y el del Entrenador (T49).
 */
export function useRoutines({ includeInactive }: { includeInactive: boolean }) {
  return useQuery(routinesPlusQuery(includeInactive));
}
