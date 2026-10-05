import type { CircuitListItem } from '@/api/types';

// Los circuitos de demo: los del prototipo, más uno dado de baja, para que el panel cuente 6 activos
// y el listado con `include_inactive` muestre 7.
const TIMESTAMP = '2026-03-10T12:00:00.000Z';

function circuit(
  index: number,
  name: string,
  type: string,
  exercise_count: number,
  active = true,
): CircuitListItem {
  return {
    id: `demo-circuit-${index + 1}`,
    name,
    type,
    active,
    exercise_count,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  };
}

export const circuits: CircuitListItem[] = [
  circuit(0, 'Empuje — Principal', 'principal', 3),
  circuit(1, 'Tirón — Principal', 'principal', 4),
  circuit(2, 'Piernas — Fuerza', 'principal', 3),
  circuit(3, 'Upper básico', 'complementario', 3),
  circuit(4, 'Lower básico', 'complementario', 2),
  circuit(5, 'Core finisher', 'core', 2),
  circuit(6, 'Core clásico', 'core', 3, false),
];
