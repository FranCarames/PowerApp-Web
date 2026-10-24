import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `DELETE /routine/assign-user/{id}`: quita la rutina puntual de un alumno (CU-E-20). Es un borrado
 * **físico**: la asignación deja de existir y no se reincorpora. Responde 409 si el alumno ya entrenó la
 * rutina (el historial se conserva) y 404 si ya no existe. Se piden de nuevo las rutinas también si
 * falla: un 404 o un 409 quieren decir que la lista estaba vieja.
 */
export function useRemoveAssignedRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete('/api/v1/routine/assign-user/{id}', { params: { id } }),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assignedRoutines.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineHome.all,
      });
    },
  });
}
