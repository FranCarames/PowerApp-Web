import type { CircuitExerciseRef, CircuitDetail } from '@/api/pending';
import type {
  CircuitListItem,
  CircuitListItemPlus,
  CircuitSetResponse,
} from '@/api/types';

import { exercises as catalog } from './exercises';

// Los circuitos de demo: los del prototipo, más uno dado de baja, para que el panel cuente 6 activos
// y el listado con `include_inactive` muestre 7. Cada uno es un `CircuitDetail`, como lo manda
// `GET /routine/circuit/{id}`: con sus ejercicios del catálogo de demo y sus bloques de series. De ahí
// se arman los listados (`all` y `all-plus`).
const TIMESTAMP = '2026-03-10T12:00:00.000Z';

/** Un ejercicio del catálogo de demo, por nombre, como lo trae el detalle de un circuito. */
export function circuitExerciseRef(
  exerciseId: string,
): CircuitExerciseRef | undefined {
  const found = catalog.find(({ id }) => id === exerciseId);
  return (
    found && {
      id: found.id,
      name: found.name,
      description: found.description,
      ...(found.safety_tips && { safety_tips: found.safety_tips }),
      ...(found.activation_tips && { activation_tips: found.activation_tips }),
      ...(found.video_url && { video_url: found.video_url }),
      ...(found.preview_image && { preview_image: found.preview_image }),
      ...(found.bg_image && { bg_image: found.bg_image }),
    }
  );
}

/** Los campos de un bloque de series que se escriben a mano: el resto sale de los valores por defecto. */
type SetSpec = Partial<
  Pick<
    CircuitSetResponse,
    'weight' | 'rpe' | 'rir' | 'rm_perc' | 'amrap' | 'amrap_time' | 'rm'
  >
> &
  Pick<CircuitSetResponse, 'set_count' | 'rep_count'>;

type ExerciseSpec = [name: string, sets: SetSpec[], coachNote?: string];

function circuit(
  index: number,
  name: string,
  type: string,
  specs: ExerciseSpec[],
  active = true,
): CircuitDetail {
  const id = `demo-circuit-${index + 1}`;
  return {
    id,
    name,
    type,
    active,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    exercises: specs.map(([exerciseName, sets, coachNote], position) => {
      const found = catalog.find((exercise) => exercise.name === exerciseName);
      const exercise = found && circuitExerciseRef(found.id);
      if (!exercise) {
        throw new Error(`El ejercicio de demo "${exerciseName}" no existe`);
      }
      const exerciseId = `${id}-exercise-${position + 1}`;
      return {
        id: exerciseId,
        exercise_order: position + 1,
        ...(coachNote && { coach_note: coachNote }),
        exercise,
        sets: sets.map((set, setPosition): CircuitSetResponse => ({
          id: `${exerciseId}-set-${setPosition + 1}`,
          set_order: setPosition + 1,
          amrap: false,
          rm: false,
          ...set,
        })),
      };
    }),
  };
}

/** Los circuitos de demo con todo su detalle. */
export const circuitDetails: CircuitDetail[] = [
  circuit(0, 'Empuje — Principal', 'principal', [
    [
      'Press de banca',
      [{ set_count: 4, rep_count: 8, weight: 80, rpe: 7 }],
      'Bajar lento en 3 segundos',
    ],
    [
      'Press inclinado mancuernas',
      [{ set_count: 3, rep_count: 10, weight: 24 }],
    ],
    ['Aperturas', [{ set_count: 3, rep_count: 12, amrap: true }]],
  ]),
  circuit(1, 'Tirón — Principal', 'principal', [
    ['Dominadas', [{ set_count: 4, rep_count: 1, amrap: true }]],
    [
      'Remo con barra',
      [
        { set_count: 3, rep_count: 6, rm_perc: 75 },
        { set_count: 1, rep_count: 1, rm: true },
      ],
    ],
    ['Pull-down polea', [{ set_count: 3, rep_count: 10, rir: 2 }]],
    ['Curl con barra', [{ set_count: 3, rep_count: 12, weight: 30 }]],
  ]),
  circuit(2, 'Piernas — Fuerza', 'principal', [
    [
      'Sentadilla',
      [
        { set_count: 1, rep_count: 1, rm: true },
        { set_count: 4, rep_count: 5, rm_perc: 80, rpe: 8 },
      ],
    ],
    ['Prensa', [{ set_count: 4, rep_count: 10, weight: 160 }]],
    [
      'Extensión de cuádriceps',
      [{ set_count: 3, rep_count: 12, weight: 45, rir: 1 }],
    ],
  ]),
  circuit(3, 'Upper básico', 'complementario', [
    ['Press de banca', [{ set_count: 4, rep_count: 8 }]],
    ['Remo con barra', [{ set_count: 4, rep_count: 8 }]],
    ['Press militar', [{ set_count: 3, rep_count: 10 }]],
  ]),
  circuit(4, 'Lower básico', 'complementario', [
    ['Sentadilla', [{ set_count: 4, rep_count: 8 }]],
    [
      'Peso muerto',
      [
        { set_count: 3, rep_count: 5 },
        { set_count: 1, rep_count: 1, rm: true },
      ],
    ],
  ]),
  circuit(5, 'Core finisher', 'core', [
    ['Plancha', [{ set_count: 3, rep_count: 1, amrap: true, amrap_time: 60 }]],
    ['Elevaciones de piernas', [{ set_count: 3, rep_count: 15 }]],
  ]),
  circuit(
    6,
    'Core clásico',
    'core',
    [
      [
        'Plancha',
        [{ set_count: 3, rep_count: 1, amrap: true, amrap_time: 45 }],
      ],
      ['Elevaciones de piernas', [{ set_count: 3, rep_count: 12 }]],
      ['Peso muerto', [{ set_count: 3, rep_count: 8 }]],
    ],
    false,
  ),
];

/** Un circuito como una fila de `GET /routine/circuit/all`: sin los ejercicios. */
export function toListItem(circuit: CircuitDetail): CircuitListItem {
  return {
    id: circuit.id,
    name: circuit.name,
    ...(circuit.description && { description: circuit.description }),
    type: circuit.type,
    active: circuit.active,
    exercise_count: circuit.exercises.length,
    created_at: circuit.created_at,
    updated_at: circuit.updated_at,
  };
}

/** Un circuito como una fila de `GET /routine/circuit/all-plus`: con el id y el nombre de cada ejercicio. */
export function toPlusItem(circuit: CircuitDetail): CircuitListItemPlus {
  return {
    ...toListItem(circuit),
    exercises: circuit.exercises.map(({ id, exercise_order, exercise }) => ({
      id,
      exercise_order,
      exercise: { id: exercise.id, name: exercise.name },
    })),
  };
}
