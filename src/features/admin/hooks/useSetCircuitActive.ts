import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /routine/circuit/set-active/{id}` (CU-E-24): la baja lógica de un circuito (`active: false`) y
 * su reactivación (`active: true`). No toca las rutinas que ya lo usan: lo conservan. Un circuito dado
 * de baja no se puede editar ni agregar a rutinas nuevas. Después se piden de nuevo los circuitos y las
 * rutinas.
 */
export function useSetCircuitActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.post('/api/v1/routine/circuit/set-active/{id}', {
        params: { id },
        body: { active },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
  });
}
