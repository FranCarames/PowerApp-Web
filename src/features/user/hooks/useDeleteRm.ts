import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `DELETE /user_rm/{id}` (CU-U-20): el borrado físico de un RM propio. Después se piden de nuevo los
 * RMs, tanto si se borró como si ya no existía.
 */
export function useDeleteRm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete('/api/v1/user_rm/{id}', { params: { id } }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.userRms.all });
    },
  });
}
