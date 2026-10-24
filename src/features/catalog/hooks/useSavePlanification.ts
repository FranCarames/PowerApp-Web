import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { EditPlanificationBody } from '@/api/types';

/**
 * `POST /planification/create` (sin `id`, CU-E-09) y `POST /planification/edit/{id}` (con el id de la
 * planificación que se edita, CU-E-10). Los dos mandan la cabecera completa: nombre, número de rutinas,
 * duración en semanas, descripción y tipo. La edición reemplaza todo: un campo opcional que se omite se
 * borra. Cambiar la duración mueve el fin de las asignaciones de todos los alumnos que tienen el plan.
 * Devuelven la planificación ya guardada, con su detalle (las rutinas del plan no se tocan acá).
 *
 * Después se piden de nuevo las planificaciones (los listados, el detalle y el panel).
 */
export function useSavePlanification(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: EditPlanificationBody) =>
      id
        ? api.post('/api/v1/planification/edit/{id}', {
            params: { id },
            body,
          })
        : api.post('/api/v1/planification/create', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      });
    },
  });
}
