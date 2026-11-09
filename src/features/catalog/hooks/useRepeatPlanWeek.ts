import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PlanificationDetail } from '@/api/types';

import { keepRemoved } from '../planRoutines';

/**
 * `POST /planification/routine/repeat-week` (CU-E-12f): copia las rutinas vigentes de una semana, en su
 * orden, al final de cada una de las semanas elegidas, en una sola operación (todo o nada). Las copias son
 * vínculos nuevos y no heredan el historial de nadie; lo que la semana destino ya tenía se conserva y la
 * semana de origen no cambia. Repetir dos veces la misma semana duplica las rutinas: está permitido.
 *
 * Responde la planificación completa ya con las copias: se deja en el caché del detalle y se muestra sin
 * esperar otro pedido. Después se piden de nuevo las planificaciones (cambió cuántas rutinas tiene).
 */
export function useRepeatPlanWeek(planificationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fromWeek,
      toWeeks,
    }: {
      fromWeek: number;
      toWeeks: number[];
    }) =>
      api.post('/api/v1/planification/routine/repeat-week', {
        body: {
          planification_id: planificationId,
          from_week: fromWeek,
          to_weeks: toWeeks,
        },
      }),
    onSuccess: (planification) => {
      // La respuesta trae solo las vigentes: las quitadas que ya se veían se conservan hasta el próximo pedido.
      queryClient.setQueryData<PlanificationDetail>(
        queryKeys.planifications.detail(planificationId),
        (current) => keepRemoved(planification, current),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      });
    },
    // Si la semana de origen cambió por otro lado, se vuelve a pedir el plan para mostrar lo que hay.
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.planifications.all,
      });
    },
  });
}
