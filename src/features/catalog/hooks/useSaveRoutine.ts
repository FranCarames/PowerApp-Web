import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { EditRoutineBody } from '@/api/types';

/**
 * `POST /routine/create` (sin `id`, CU-E-16) y `POST /routine/edit/{id}` (con el id de la rutina que
 * se edita, CU-E-17). Los dos mandan la rutina completa: nombre, nota del entrenador y la lista de
 * circuitos en orden. En la edición esa lista reemplaza a la guardada: un ítem con `id` (el del
 * vínculo `Routine_Circuit`, no el del circuito) se mantiene, uno sin `id` es un vínculo nuevo y los
 * que no vuelven se dan de baja. La nota que se omite se borra. Devuelven la rutina ya guardada, con
 * su `id`.
 *
 * Después se piden de nuevo las rutinas y los circuitos (los listados, los detalles y el panel).
 */
export function useSaveRoutine(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    // `EditRoutineBody` es el alta más el `id` opcional de cada vínculo, que en un alta nunca se manda.
    mutationFn: (body: EditRoutineBody) =>
      id
        ? api.post('/api/v1/routine/edit/{id}', { params: { id }, body })
        : api.post('/api/v1/routine/create', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
