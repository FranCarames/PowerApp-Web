import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `POST /membership/payment/register`: registra un pago de membresía de un alumno (CU-E-29). Manda
 * solo el alumno y el tipo: el nombre, la duración y el precio los copia el backend del tipo, y el
 * vencimiento (hoy más la duración, al final del día) lo calcula él. Cubre altas y renovaciones.
 * Después se piden de nuevo el resumen, las listas por estado y los pagos de los alumnos.
 */
export function useRegisterPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { user_id: string; membership_id: string }) =>
      api.post('/api/v1/membership/payment/register', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memberships.all,
      });
    },
  });
}
