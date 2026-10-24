import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /routine/set-active/{id}` (CU-E-18): la baja lógica de una rutina (`active: false`) y su
 * reactivación (`active: true`). No cascadea nada: las planificaciones que la incluyen y los alumnos
 * que ya la tienen la conservan; solo deja de ofrecerse para asignaciones nuevas. Una rutina dada de
 * baja no se puede editar. Después se piden de nuevo las rutinas y los circuitos.
 */
export function useSetRoutineActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post('/api/v1/routine/set-active/{id}', {
        params: { id },
        body: { active },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
