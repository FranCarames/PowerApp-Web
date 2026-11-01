import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * Las opciones de la query de `GET /planification/all`: las planificaciones sistémicas ordenadas por
 * nombre (las que no tienen, al final). Con `includeInactive` trae también las dadas de baja, que el
 * backend deja afuera si no. Es de entrenador y admin.
 */
export function planificationsQuery(includeInactive: boolean) {
  return queryOptions({
    queryKey: queryKeys.planifications.list(includeInactive),
    queryFn: ({ signal }) =>
      api.get('/api/v1/planification/all', {
        // Sin el parámetro, el backend trae solo las vigentes: `false` no se manda.
        query: includeInactive ? { include_inactive: true } : undefined,
        signal,
      }),
  });
}

/**
 * `GET /planification/all`: cada planificación con su nombre, descripción, tipo, duración en semanas
 * (0 es sin duración fija, en un plan viejo), las rutinas por semana que declaró el entrenador
 * (`number_of_routines`) y las que tiene asignadas (`routine_count`, solo los vínculos vigentes). **No trae las rutinas**: para
 * eso está el detalle. Las usa el listado de planificaciones (`PlanList`), el del Admin (T23) y el del
 * Entrenador (T49).
 */
export function usePlanifications({
  includeInactive,
}: {
  includeInactive: boolean;
}) {
  return useQuery(planificationsQuery(includeInactive));
}
