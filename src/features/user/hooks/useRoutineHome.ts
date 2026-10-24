import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /routine/home/{userId}`: el home del alumno en una semana. Se le manda el lunes de la semana
 * (`date`) y `week=1`, así que responde una sola semana, de lunes a domingo, con las rutinas de sus
 * planificaciones (un grupo por plan, sin día) y las individuales de cada día, cada una con su
 * progreso. La app manda siempre `date`: sin él, el backend usa el día de hoy en hora de Argentina.
 *
 * Al pasar a otra semana, mientras llega se sigue viendo la anterior (`isPlaceholderData`).
 */
export function useRoutineHome(userId: string, weekStart: string) {
  return useQuery({
    queryKey: queryKeys.routineHome.week(userId, weekStart),
    queryFn: ({ signal }) =>
      api.get('/api/v1/routine/home/{userId}', {
        params: { userId },
        query: { date: weekStart, week: 1 },
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}
