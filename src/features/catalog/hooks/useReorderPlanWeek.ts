import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PlanificationDetail } from '@/api/types';

import { reorderRoutines } from '../planRoutines';

/**
 * `POST /planification/routine/reorder` (CU-E-12e): manda la semana entera (los ids de todos sus vínculos
 * vigentes, en el orden nuevo) y el backend la renumera de 1 a n en una transacción. Cada movimiento es un
 * pedido; el backend lo rechaza (400) si la lista no coincide con las vigentes de la semana, y entonces no
 * cambia nada.
 *
 * El orden nuevo se ve **antes** de que responda el servidor: se escribe en el caché del detalle y, si el
 * pedido falla, `onError` avisa y se vuelve a pedir el plan, que muestra el orden que realmente hay. Con
 * varios movimientos seguidos (una flecha apretada varias veces) los pedidos salen de a uno y en orden
 * (`scope`), y la respuesta de uno no pisa lo que ya se ve del siguiente: solo la del último se guarda.
 * Reordenar no cambia ningún contador, así que no se piden de nuevo los listados.
 */
export function useReorderPlanWeek(
  planificationId: string,
  onError: (error: unknown) => void,
) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.planifications.detail(planificationId);
  const pending = useRef(0);

  return useMutation({
    scope: { id: `planification-reorder-${planificationId}` },
    mutationFn: ({ week, ids }: { week: number; ids: string[] }) =>
      api.post('/api/v1/planification/routine/reorder', {
        body: {
          planification_id: planificationId,
          week,
          routine_asignation_ids: ids,
        },
      }),
    onMutate: async ({ week, ids }) => {
      pending.current += 1;
      // Un GET en vuelo traería el orden viejo y lo dejaría encima del nuevo.
      await queryClient.cancelQueries({ queryKey: detailKey });
      queryClient.setQueryData<PlanificationDetail>(detailKey, (current) =>
        current ? reorderRoutines(current, week, ids) : current,
      );
    },
    onSuccess: (planification) => {
      if (pending.current === 1) {
        queryClient.setQueryData(detailKey, planification);
      }
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: detailKey });
      onError(error);
    },
    onSettled: () => {
      pending.current -= 1;
    },
  });
}
