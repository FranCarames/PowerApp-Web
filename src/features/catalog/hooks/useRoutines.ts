import { queryOptions, useQuery } from '@tanstack/react-query';

import { api, request } from '@/api/client';
import type { RoutineTree } from '@/api/pending';
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

/**
 * `GET /routine/{id}`: una rutina con sus circuitos en orden (solo los vínculos activos), cada uno con
 * el circuito completo: sus ejercicios activos con su ficha del catálogo y sus bloques de series.
 * Responde también por una dada de baja y 404 si no existe. Es de entrenador y admin (el alumno lee la
 * rutina por su asignación). Se llama con `request` porque el contrato declara el `exercise` de cada
 * ejercicio como un objeto vacío (V2). Con `id` `null` no pide nada.
 *
 * No se guarda en el caché sin quien lo mire (`gcTime: 0`): el editor llena el formulario con estos
 * datos al abrirse, y con unos viejos se guardaría encima de una edición hecha en el medio.
 */
export function useRoutine(id: string | null) {
  return useQuery({
    queryKey: queryKeys.routines.detail(id ?? ''),
    queryFn: async ({ signal }) =>
      (
        await request<RoutineTree>(
          'get',
          `/api/v1/routine/${encodeURIComponent(id ?? '')}`,
          { signal },
        )
      ).data,
    enabled: id !== null,
    gcTime: 0,
  });
}
