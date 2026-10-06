import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * `GET /routine/circuit/all-plus`: los circuitos con sus ejercicios (el `id` y el nombre de cada uno,
 * en orden) y la cantidad de ejercicios, ordenados por nombre. Con `includeInactive` trae también los
 * dados de baja, que el backend deja afuera si no. Es de entrenador y admin. Los usan el listado de
 * circuitos del Admin (T19) y, después, el del Entrenador (T48).
 */
export function useCircuits({ includeInactive }: { includeInactive: boolean }) {
  return useQuery({
    queryKey: queryKeys.routines.circuitsPlus(includeInactive),
    queryFn: ({ signal }) =>
      api.get('/api/v1/routine/circuit/all-plus', {
        // Sin el parámetro, el backend trae solo los vigentes: `false` no se manda.
        query: includeInactive ? { include_inactive: true } : undefined,
        signal,
      }),
  });
}

/** Una rutina que usa un circuito. */
export interface CircuitUsage {
  id: string;
  name: string;
}

/**
 * Qué rutinas usan cada circuito: `circuito → rutinas` (su cantidad es el largo de la lista). No hay un
 * endpoint que lo devuelva, así que se calcula con `GET /routine/all-plus`, que trae los circuitos de cada
 * rutina. Cuentan las rutinas vigentes (sin `include_inactive` el backend deja afuera las dadas de baja) y
 * los vínculos activos. Un circuito puede repetirse dentro de una rutina: esa rutina figura una sola vez. Un
 * circuito que ninguna rutina usa no figura: son cero.
 */
export function useCircuitUsage() {
  return useQuery({
    queryKey: queryKeys.routines.listPlus(false),
    queryFn: ({ signal }) => api.get('/api/v1/routine/all-plus', { signal }),
    select: (routines) => {
      const usage = new Map<string, CircuitUsage[]>();
      for (const { id, name, circuits } of routines) {
        const circuitIds = new Set(circuits.map(({ circuit }) => circuit.id));
        for (const circuitId of circuitIds) {
          usage.set(circuitId, [...(usage.get(circuitId) ?? []), { id, name }]);
        }
      }
      return usage;
    },
  });
}
