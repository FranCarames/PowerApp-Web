import { useMutation, useQueryClient } from '@tanstack/react-query';

import { request } from '@/api/client';
import type { EditCoachRequest } from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';
import type { Coach } from '@/api/types';

/**
 * `POST /coach/edit/{id}` (CU-A-18): edita el email profesional y el CUIL de un entrenador. El
 * contrato todavía no tiene este endpoint (PENDIENTE-CONTRATO: B8): se llama con `request` y hoy lo
 * responde un mock. Cuando exista, se tipa con `schema.d.ts` y se pasa a `api.post`.
 *
 * Después se piden de nuevo los datos de los entrenadores (el listado, el detalle y el panel).
 */
export function useEditCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: EditCoachRequest & { id: string }) =>
      request<Coach>('post', `/api/v1/coach/edit/${encodeURIComponent(id)}`, {
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coaches.all });
    },
  });
}
