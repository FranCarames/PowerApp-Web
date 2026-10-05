import type { PlanificationListItem } from '@/api/types';

// Las planificaciones sistémicas de demo: las del prototipo, más una dada de baja. `duration` es un
// texto libre ("8 semanas"), `number_of_routines` lo que declara el entrenador y `routine_count` lo
// que está asignado.
const TIMESTAMP = '2026-03-15T12:00:00.000Z';

function planification(
  index: number,
  name: string,
  type: string,
  weeks: number,
  number_of_routines: number,
  routine_count: number,
  active = true,
): PlanificationListItem {
  return {
    id: `demo-planification-${index + 1}`,
    name,
    type,
    duration: `${weeks} semanas`,
    number_of_routines,
    routine_count,
    active,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  };
}

export const planifications: PlanificationListItem[] = [
  planification(0, 'Fuerza 5×5', 'fuerza', 8, 3, 3),
  planification(1, 'Hipertrofia A/B', 'hipertrofia', 6, 2, 2),
  planification(2, 'Full Body', 'resistencia', 4, 3, 3),
  planification(3, 'Powerbuilding', 'fuerza', 12, 4, 4),
  planification(4, 'Volumen verano', 'hipertrofia', 10, 4, 2, false),
];
