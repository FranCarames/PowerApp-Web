import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /planification/user/set-active/{id}`: quita la planificación de un alumno (baja lógica,
 * `active: false`) o la reincorpora con sus mismas fechas (`active: true`), CU-E-14. Pedir el estado que
 * ya tiene da 400 (otro entrenador la cambió antes), así que se piden de nuevo las planificaciones
 * también si falla: la lista se pone al día.
 */
export function useSetUserPlanificationActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post('/api/v1/planification/user/set-active/{id}', {
        params: { id },
        body: { active },
      }),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      });
    },
  });
}
