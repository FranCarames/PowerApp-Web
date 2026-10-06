import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /coach/get/{id}`: los datos profesionales de un entrenador, con el mismo id que su usuario:
 * el email profesional y el CUIL. No trae nombre ni apellido (V3): esos están en el usuario. Con `id`
 * `null` no pide nada (el modal de edición está cerrado).
 *
 * No se guarda en el caché sin quien lo mire (`gcTime: 0`): el modal de edición llena el formulario con
 * estos datos al abrirse, y con unos viejos del caché, un campo que no se toca se guardaría de nuevo con
 * el valor de antes y pisaría una edición hecha en el medio.
 */
export function useCoach(id: string | null) {
  return useQuery({
    queryKey: queryKeys.coaches.detail(id ?? ''),
    queryFn: ({ signal }) =>
      api.get('/api/v1/coach/get/{id}', { params: { id: id ?? '' }, signal }),
    enabled: id !== null,
    gcTime: 0,
  });
}
