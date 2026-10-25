import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /planification/set-active/{id}` (CU-E-11): la baja lógica de una planificación (`active: false`)
 * y su reactivación (`active: true`). No cascadea nada: ni las rutinas del plan ni las asignaciones a
 * alumnos se tocan; el plan solo deja de ofrecerse como plantilla para asignaciones nuevas. Mientras
 * está dado de baja, el backend rechaza editarlo y cambiarle las rutinas (400). Después se piden de
 * nuevo las planificaciones.
 */
export function useSetPlanificationActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post('/api/v1/planification/set-active/{id}', {
        params: { id },
        body: { active },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      });
    },
  });
}
