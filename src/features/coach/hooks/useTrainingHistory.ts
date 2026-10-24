import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /routine/history/{userId}`: las sesiones de un alumno con al menos un ejercicio hecho, de la más
 * nueva a la más vieja (CU-E-06). Cada una trae los ejercicios que hizo, con el día, su nota y las
 * series de la rutina, que son la prescripción vigente y no lo que levantó. Solo coach y admin.
 *
 * Con `exerciseId` (el `id` del ejercicio del catálogo, no el de la rutina) el backend devuelve solo las
 * sesiones donde lo hizo y, en cada una, únicamente ese ejercicio (CU-E-07). Sin él, y con el filtro
 * puesto, son dos queries distintas: la lista completa sigue en el caché para armar el selector.
 */
export function useTrainingHistory(
  userId: string,
  exerciseId: string | null = null,
) {
  return useQuery({
    queryKey: queryKeys.trainingHistory.byUser(userId, exerciseId),
    queryFn: ({ signal }) =>
      api.get('/api/v1/routine/history/{userId}', {
        params: { userId },
        query: exerciseId ? { exercise_id: exerciseId } : undefined,
        signal,
      }),
  });
}
