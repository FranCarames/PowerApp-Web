import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /planification/{id}`: la planificación con su nombre, descripción, tipo, duración en semanas (0 es
 * sin duración fija en un plan viejo), las rutinas por semana que declaró el entrenador (`number_of_routines`:
 * define los huecos de cada semana, no es un tope) y las asignadas (`routine_count`), y sus **rutinas vigentes** en una lista plana, ordenada por semana y posición: cada
 * una con el `id` de su vínculo (no el de la rutina), su `week`, su `order` y la rutina (que puede estar
 * dada de baja y sigue apareciendo). Las rutinas quitadas del plan no vienen. Responde también por un plan
 * dado de baja y 404 si no existe. Es de entrenador y admin. Con `id` `null` no pide nada.
 *
 * No se guarda en el caché sin quien lo mire (`gcTime: 0`): el formulario se llena con estos datos al
 * abrirse, y con unos viejos se guardaría encima de una edición hecha en el medio.
 */
export function usePlanification(id: string | null) {
  return useQuery({
    queryKey: queryKeys.planifications.detail(id ?? ''),
    queryFn: ({ signal }) =>
      api.get('/api/v1/planification/{id}', {
        params: { id: id ?? '' },
        signal,
      }),
    enabled: id !== null,
    gcTime: 0,
  });
}
