import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { AssignRoutineToUserBody } from '@/api/types';

/**
 * `POST /routine/assign-user`: asigna una rutina a un alumno para un día (CU-E-19). Son tantas
 * asignaciones como días. Responde 409 si el alumno ya tiene esa rutina ese día, 400 si la rutina está
 * dada de baja o el destinatario no es un alumno con la cuenta abierta, y 404 si no existen. Después se
 * piden de nuevo las rutinas puntuales y el home del alumno.
 */
export function useAssignRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AssignRoutineToUserBody) =>
      api.post('/api/v1/routine/assign-user', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assignedRoutines.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineHome.all,
      });
    },
  });
}
