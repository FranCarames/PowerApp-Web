import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { CreatePlanificationBody } from '@/api/types';

/**
 * `POST /planification/create` (sin `id`, CU-E-09) y `POST /planification/edit/{id}` (con el id de la
 * planificación que se edita, CU-E-10). Los dos mandan la cabecera completa: nombre, rutinas por semana
 * (`number_of_routines`), duración en semanas, descripción y tipo. La edición reemplaza todo: un campo
 * opcional que se omite se borra. Cambiar la duración mueve el fin de las asignaciones de todos los alumnos
 * que tienen el plan.
 *
 * El alta puede traer además `weeks`, las rutinas de cada semana que se armaron antes de crear: el backend
 * guarda la planificación y todas sus rutinas en una sola operación, todo o nada. La edición no las lleva
 * (las rutinas de un plan que existe se cambian aparte, al instante) y el backend rechazaría el campo.
 * Devuelven la planificación ya guardada, con su detalle.
 *
 * Después se piden de nuevo las planificaciones (los listados, el detalle y el panel).
 */
export function useSavePlanification(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weeks, ...header }: CreatePlanificationBody) =>
      id
        ? api.post('/api/v1/planification/edit/{id}', {
            params: { id },
            body: header,
          })
        : api.post('/api/v1/planification/create', {
            body: weeks ? { ...header, weeks } : header,
          }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      });
    },
  });
}
