import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /membership/payment/user/{id}`: los pagos de un usuario. Desde el 17/10 el backend los manda del
 * más reciente al más viejo, pero quien los muestra los ordena igual y no depende de eso. Los usan el historial de pagos y la píldora de Mi cuenta, que
 * comparten esta query y por eso piden los datos una sola vez.
 */
export function useUserPayments(userId: string) {
  return useQuery({
    queryKey: queryKeys.memberships.payments(userId),
    queryFn: ({ signal }) =>
      api.get('/api/v1/membership/payment/user/{id}', {
        params: { id: userId },
        signal,
      }),
  });
}
