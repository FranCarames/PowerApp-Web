import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `DELETE /muscles/mg/{id}` (CU-A-15): el borrado físico de un grupo muscular. El backend lo rechaza
 * si todavía tiene músculos (V7). Después se piden de nuevo los grupos y los músculos.
 */
export function useDeleteMuscleGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete('/api/v1/muscles/mg/{id}', { params: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.muscles.all });
    },
  });
}
