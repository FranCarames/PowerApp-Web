import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * Quita rutinas del plan (`active: false`) o las reincorpora (`active: true`). Es siempre una baja
 * lógica: el vínculo `Routine_Asignation` conserva su semana y su posición y el historial de los
 * alumnos queda intacto. Los ids son los de los **vínculos** (el `id` de cada rutina del detalle), no
 * los de las rutinas.
 *
 * Con un solo id va por `POST /planification/routine/set-active/{id}` (CU-E-12c): al reincorporar admite
 * una `week` y un `order`; sin ninguno vuelve a su lugar, con solo la semana va al final de ella, y con
 * `order` se guarda tal cual. Mandarlos al quitar es un 400. Con varios va por
 * `POST /planification/routine/set-active-bulk` (CU-E-12d): sin lugar, cada una vuelve al suyo, y es
 * todo o nada.
 *
 * Reincorporar a una semana que la duración del plan ya no cubre es un 400. Las respuestas son los
 * vínculos, no el plan: la mutación sigue pendiente hasta que el detalle vuelve a pedirse con el cambio
 * hecho.
 */
export function useSetPlanRoutinesActive() {
  const queryClient = useQueryClient();

  return useMutation({
    // Con un id responde el vínculo y con varios, la lista: por eso es `async`, para que el tipo sea la unión.
    mutationFn: async ({
      ids,
      active,
      week,
      order,
    }: {
      ids: string[];
      active: boolean;
      /** Solo al reincorporar una sola. */
      week?: number;
      /** Solo al reincorporar una sola. */
      order?: number;
    }) => {
      const [first] = ids;
      if (ids.length === 1 && first !== undefined) {
        return await api.post('/api/v1/planification/routine/set-active/{id}', {
          params: { id: first },
          body: {
            active,
            ...(week !== undefined && { week }),
            ...(order !== undefined && { order }),
          },
        });
      }
      return await api.post('/api/v1/planification/routine/set-active-bulk', {
        body: { routine_asignation_ids: ids, active },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      }),
  });
}
