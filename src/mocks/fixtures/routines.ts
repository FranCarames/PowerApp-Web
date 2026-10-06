import type { RoutineListItem, RoutineListItemPlus } from '@/api/types';

import { circuitDetails } from './circuits';

// Las rutinas sistémicas de demo: las del prototipo, más una dada de baja. Cada una trae sus circuitos
// (los vínculos activos, en orden), como los manda `GET /routine/all-plus`: de ahí sale en cuántas
// rutinas se usa cada circuito.
const TIMESTAMP = '2026-03-12T12:00:00.000Z';

function routine(
  index: number,
  name: string,
  circuitIndexes: number[],
  active = true,
): RoutineListItemPlus {
  const id = `demo-routine-${index + 1}`;
  return {
    id,
    name,
    active,
    circuit_count: circuitIndexes.length,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    circuits: circuitIndexes.map((circuitIndex, position) => {
      const {
        id: circuitId,
        name: circuitName,
        type,
        active: circuitActive,
      } = circuitDetails[circuitIndex];
      return {
        id: `${id}-circuit-${position + 1}`,
        order: position + 1,
        circuit: {
          id: circuitId,
          name: circuitName,
          type,
          active: circuitActive,
        },
      };
    }),
  };
}

/** Las rutinas con sus circuitos (`GET /routine/all-plus`). */
export const routinesPlus: RoutineListItemPlus[] = [
  routine(0, 'Día A — Empuje', [0, 5]),
  routine(1, 'Día B — Tirón', [1]),
  routine(2, 'Día C — Piernas', [2, 5]),
  routine(3, 'Full Upper', [3]),
  routine(4, 'Full Lower', [4, 5]),
  routine(5, 'Día D — Brazos', [0], false),
];

/** Las mismas rutinas sin los circuitos (`GET /routine/all`). */
export const routines: RoutineListItem[] = routinesPlus.map((item) => ({
  id: item.id,
  name: item.name,
  active: item.active,
  circuit_count: item.circuit_count,
  created_at: item.created_at,
  updated_at: item.updated_at,
}));
