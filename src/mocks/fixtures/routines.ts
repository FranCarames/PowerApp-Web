import type { RoutineListItem } from '@/api/types';

// Las rutinas sistémicas de demo: las del prototipo, más una dada de baja.
const TIMESTAMP = '2026-03-12T12:00:00.000Z';

function routine(
  index: number,
  name: string,
  circuit_count: number,
  active = true,
): RoutineListItem {
  return {
    id: `demo-routine-${index + 1}`,
    name,
    active,
    circuit_count,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  };
}

export const routines: RoutineListItem[] = [
  routine(0, 'Día A — Empuje', 2),
  routine(1, 'Día B — Tirón', 1),
  routine(2, 'Día C — Piernas', 2),
  routine(3, 'Full Upper', 1),
  routine(4, 'Full Lower', 2),
  routine(5, 'Día D — Brazos', 1, false),
];
