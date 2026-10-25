import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/** Cuántas rutinas admite una sola alta en lote (`routine_ids`). El contrato no lo declara; es el tope del backend. */
export const PLAN_BULK_MAX = 50;

/**
 * Agrega rutinas a una semana de la planificación. Con una sola rutina va por
 * `POST /planification/routine/assign` (CU-E-12a), que admite una posición dentro de la semana; sin
 * posición va al final de la semana. Con varias va por `POST /planification/routine/assign-bulk`
 * (CU-E-12b): una semana por lote, al final de ella, consecutivas y en el orden dado, todo o nada. La
 * misma rutina se puede agregar más de una vez, y la posición es una etiqueta que puede repetirse.
 *
 * Los dos devuelven la planificación completa ya con las rutinas nuevas: se la deja en el caché del
 * detalle y se muestra sin esperar otro pedido. Después se piden de nuevo las planificaciones.
 */
export function useAssignPlanRoutines(planificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      week,
      routineIds,
      order,
    }: {
      week: number;
      routineIds: string[];
      /** Solo con una rutina: sin ella, va al final de la semana. */
      order?: number;
    }) => {
      const [first] = routineIds;
      return routineIds.length === 1 && first !== undefined
        ? api.post('/api/v1/planification/routine/assign', {
            body: {
              planification_id: planificationId,
              routine_id: first,
              week,
              ...(order !== undefined && { order }),
            },
          })
        : api.post('/api/v1/planification/routine/assign-bulk', {
            body: {
              planification_id: planificationId,
              week,
              routine_ids: routineIds,
            },
          });
    },
    onSuccess: (planification) => {
      queryClient.setQueryData(
        queryKeys.planifications.detail(planificationId),
        planification,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      });
    },
  });
}
