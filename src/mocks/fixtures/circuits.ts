import type { CircuitListItem, CircuitListItemPlus } from '@/api/types';

import { exercises as catalog } from './exercises';

// Los circuitos de demo: los del prototipo, más uno dado de baja, para que el panel cuente 6 activos
// y el listado con `include_inactive` muestre 7. Cada uno trae sus ejercicios, que son del catálogo de
// demo, como los manda `GET /routine/circuit/all-plus`.
const TIMESTAMP = '2026-03-10T12:00:00.000Z';

/** Un ejercicio del catálogo de demo, por nombre: el `id` y el `name`, que es lo que trae `all-plus`. */
function exerciseRef(name: string) {
  const found = catalog.find((exercise) => exercise.name === name);
  if (!found) throw new Error(`El ejercicio de demo "${name}" no existe`);
  return { id: found.id, name: found.name };
}

function circuit(
  index: number,
  name: string,
  type: string,
  exerciseNames: string[],
  active = true,
): CircuitListItemPlus {
  const id = `demo-circuit-${index + 1}`;
  return {
    id,
    name,
    type,
    active,
    exercise_count: exerciseNames.length,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    exercises: exerciseNames.map((exerciseName, position) => ({
      id: `${id}-exercise-${position + 1}`,
      exercise_order: position + 1,
      exercise: exerciseRef(exerciseName),
    })),
  };
}

/** Los circuitos con sus ejercicios (`GET /routine/circuit/all-plus`). */
export const circuitsPlus: CircuitListItemPlus[] = [
  circuit(0, 'Empuje — Principal', 'principal', [
    'Press de banca',
    'Press inclinado mancuernas',
    'Aperturas',
  ]),
  circuit(1, 'Tirón — Principal', 'principal', [
    'Dominadas',
    'Remo con barra',
    'Pull-down polea',
    'Curl con barra',
  ]),
  circuit(2, 'Piernas — Fuerza', 'principal', [
    'Sentadilla',
    'Prensa',
    'Extensión de cuádriceps',
  ]),
  circuit(3, 'Upper básico', 'complementario', [
    'Press de banca',
    'Remo con barra',
    'Press militar',
  ]),
  circuit(4, 'Lower básico', 'complementario', ['Sentadilla', 'Peso muerto']),
  circuit(5, 'Core finisher', 'core', ['Plancha', 'Elevaciones de piernas']),
  circuit(
    6,
    'Core clásico',
    'core',
    ['Plancha', 'Elevaciones de piernas', 'Peso muerto'],
    false,
  ),
];

/** Los mismos circuitos sin los ejercicios (`GET /routine/circuit/all`). */
export const circuits: CircuitListItem[] = circuitsPlus.map((item) => ({
  id: item.id,
  name: item.name,
  type: item.type,
  active: item.active,
  exercise_count: item.exercise_count,
  created_at: item.created_at,
  updated_at: item.updated_at,
}));
