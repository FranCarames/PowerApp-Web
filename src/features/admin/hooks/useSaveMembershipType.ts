import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { Membership } from '@/api/types';

import type { MembershipTypeValues } from '../schemas';

/**
 * `POST /membership/create` (sin `type`) y `POST /membership/edit/{id}` (con el tipo que se edita).
 * Cubren CU-A-21 y CU-A-22. Editar no cambia los pagos ya registrados: guardan su propia copia del
 * nombre, la duración y el precio. Después se pide de nuevo la lista de tipos.
 */
export function useSaveMembershipType(type?: Membership) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: MembershipTypeValues) =>
      type
        ? api.post('/api/v1/membership/edit/{id}', {
            params: { id: type.id },
            body: values,
          })
        : api.post('/api/v1/membership/create', { body: values }),
    onSuccess: () => {
      // Los alumnos por tipo y los pagos no cambian: solo se pide de nuevo la lista de tipos.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memberships.list(),
      });
    },
  });
}
