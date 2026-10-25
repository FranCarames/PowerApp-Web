import { useQuery } from '@tanstack/react-query';

import { request } from '@/api/client';
import type { AssignedRoutineDetail, PlanSessionDetail } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /routine/assign-user/{id}`: una rutina individual del alumno, abierta desde su asignación. Trae
 * la rutina (el árbol de `GET /routine/{id}`: circuitos en orden, cada uno con sus ejercicios y sus
 * series) y `finished[]`, lo que el alumno ya hizo, que se cruza con el árbol por `routine_exercise_id`.
 * Lo dado de baja aparece solo si el alumno hizo algo en ello. 403 si es de otro alumno y 404 si no
 * existe. Se llama con `request` porque el contrato declara el `exercise` de cada ejercicio como un
 * objeto vacío (V2).
 */
export function useIndividualRoutine(assignmentId: string) {
  return useQuery({
    queryKey: queryKeys.routineDetail.individual(assignmentId),
    queryFn: async ({ signal }) =>
      (
        await request<AssignedRoutineDetail>(
          'get',
          `/api/v1/routine/assign-user/${encodeURIComponent(assignmentId)}`,
          { signal },
        )
      ).data,
  });
}

/**
 * `GET /routine/assign-plan/{userPlanificationId}/{routineAsignationId}`: una rutina de una semana del
 * plan, con la planificación, la semana (`week`, `week_start`, `week_end`) y lo que el alumno hizo.
 * Los `active` dicen si el entrenador quitó la planificación del alumno (la sesión queda congelada),
 * si quitó la rutina del plan (se ve solo lo hecho) o si dio de baja el plan o la rutina (se siguen
 * ejecutando). 403 si es de otro alumno y 404 si no existe, no es del plan, o es una rutina quitada en
 * la que el alumno no hizo nada.
 */
export function usePlanRoutine(
  userPlanificationId: string,
  routineAsignationId: string,
) {
  return useQuery({
    queryKey: queryKeys.routineDetail.planSession(
      userPlanificationId,
      routineAsignationId,
    ),
    queryFn: async ({ signal }) =>
      (
        await request<PlanSessionDetail>(
          'get',
          `/api/v1/routine/assign-plan/${encodeURIComponent(userPlanificationId)}/${encodeURIComponent(routineAsignationId)}`,
          { signal },
        )
      ).data,
  });
}
