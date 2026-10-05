import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /membership/payment/user/{id}`: los pagos de un usuario. El backend los devuelve sin ordenar,
 * así que quien los muestra los ordena. Los usan el historial de pagos y la píldora de Mi cuenta, que
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
