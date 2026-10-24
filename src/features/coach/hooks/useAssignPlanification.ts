import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { AssignPlanificationBody } from '@/api/types';

/**
 * `POST /planification/user/assign`: asigna una planificación a un alumno con su inicio, su fin y una
 * nota (CU-E-13). Solo lo hace el entrenador (al admin el backend le responde 403). Si el alumno ya tiene
 * otra asignación vigente en esas fechas responde 409 con `overlapping`: reenviando con `confirm_overlap:
 * true` se crea igual y las dos conviven. Después se piden de nuevo las planificaciones.
 */
export function useAssignPlanification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AssignPlanificationBody) =>
      api.post('/api/v1/planification/user/assign', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      });
    },
  });
}
