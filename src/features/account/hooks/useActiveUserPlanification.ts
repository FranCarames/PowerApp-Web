import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * Cuánto se espera la planificación vigente. Hoy el backend no responde `GET /planification/user/
 * {id}/active` (el controller no llama al service) y el request queda colgado: se corta antes de los
 * 4 s en los que el cliente avisa que el servidor está despertando (`COLD_START_HINT_MS`).
 */
const RESPONSE_TIMEOUT_MS = 3500;

/**
 * `GET /planification/user/{id}/active`: la planificación vigente de un alumno. Hasta que el backend
 * la implemente (bloque C2) falla por tiempo: quien la muestra la omite si no llegó.
 */
export function useActiveUserPlanification(userId: string) {
  return useQuery({
    queryKey: queryKeys.planifications.userActive(userId),
    queryFn: ({ signal }) =>
      api.get('/api/v1/planification/user/{id}/active', {
        params: { id: userId },
        signal: AbortSignal.any([
          signal,
          AbortSignal.timeout(RESPONSE_TIMEOUT_MS),
        ]),
      }),
    retry: false,
  });
}
