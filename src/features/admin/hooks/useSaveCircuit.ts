import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { CreateCircuitBody } from '@/api/types';

/**
 * `POST /routine/circuit/create` (sin `id`, CU-E-22) y `POST /routine/circuit/edit/{id}` (con el id del
 * circuito que se edita, CU-E-23). Los dos mandan el circuito completo, con todos sus ejercicios y sus
 * series: el backend arma el alta y, en la edición, compara la lista contra la guardada (los ejercicios
 * que ya no vienen se dan de baja o se borran, según tengan historial). Editar afecta a todas las
 * rutinas que usan el circuito. Devuelven el circuito ya guardado, con su `id`.
 *
 * Después se piden de nuevo los circuitos y las rutinas (los listados, el detalle y el panel).
 */
export function useSaveCircuit(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateCircuitBody) =>
      id
        ? api.post('/api/v1/routine/circuit/edit/{id}', {
            params: { id },
            body,
          })
        : api.post('/api/v1/routine/circuit/create', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
