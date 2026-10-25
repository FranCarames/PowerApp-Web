import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /planification/user/{userId}`: las planificaciones que le asignaron a un alumno, de la más
 * nueva a la más vieja. Sin `includeInactive` son las que no se quitaron (incluye las ya terminadas
 * y las futuras): cuál está vigente hoy lo decide quien las muestra, por las fechas.
 */
export function useUserPlanifications(
  userId: string,
  { includeInactive = false }: { includeInactive?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.planifications.ofUser(userId, includeInactive),
    queryFn: ({ signal }) =>
      api.get('/api/v1/planification/user/{userId}', {
        params: { userId },
        query: { include_inactive: includeInactive },
        signal,
      }),
    // Es un dato accesorio de quien lo muestra: si falla, se omite sin reintentar.
    retry: false,
  });
}
