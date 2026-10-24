import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /routine/assigned/{userId}`: las rutinas puntuales de un alumno (CU-E-19 y CU-E-20), cada una con
 * su día, el nombre de la rutina (`active: false` si la dieron de baja después de asignarla) y el
 * progreso del alumno. Sin `from` ni `to` trae todas, de la fecha más vieja a la más nueva: el entrenador
 * no filtra (los días de la semana son del home del alumno). Lo ven el entrenador y el admin. Con `enabled`
 * en `false` no pide nada: el modal del alumno la pide recién al abrirse.
 */
export function useAssignedRoutines(
  userId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.assignedRoutines.byUser(userId),
    queryFn: ({ signal }) =>
      api.get('/api/v1/routine/assigned/{userId}', {
        params: { userId },
        signal,
      }),
    enabled,
  });
}
