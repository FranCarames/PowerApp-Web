import type { RoutineTree } from '@/api/pending';

import { circuitDetails } from './circuits';

// Las rutinas de demo del alumno: cada una es una lista de circuitos de `circuits.ts`, así que sus
// ejercicios y series son los mismos que ve el Admin. El home (`home.ts`) y el detalle
// (`routineDetails.ts`) las comparten, para que el progreso de una rutina en el home coincida con lo
// que muestra su detalle.
const TIMESTAMP = '2026-03-12T12:00:00.000Z';

export interface DemoRoutine {
  id: string;
  name: string;
  coachNote: string | null;
  /** Los circuitos de la rutina, como posiciones de `circuitDetails`, en orden. */
  circuits: readonly number[];
}

function demoRoutine(
  key: string,
  name: string,
  circuits: readonly number[],
  coachNote: string | null = null,
): DemoRoutine {
  return { id: `demo-routine-${key}`, name, coachNote, circuits };
}

export const DEMO_ROUTINES = {
  push: demoRoutine(
    'push',
    'Empuje',
    [0, 5],
    'Descansá dos minutos entre series de los básicos.',
  ),
  pull: demoRoutine('pull', 'Tirón', [1]),
  legs: demoRoutine('legs', 'Piernas', [2, 5]),
  conditioning: demoRoutine('conditioning', 'Cardio y core', [5, 3]),
  evaluation: demoRoutine('evaluation', 'Evaluación inicial', [3, 4]),
  mobility: demoRoutine('mobility', 'Movilidad y core', [5]),
  adaptation: demoRoutine('adaptation', 'Rutina de adaptación', [4, 5]),
} satisfies Record<string, DemoRoutine>;

/** Los ids de los ejercicios de la rutina, sin repetir y en el orden en que aparecen. */
export function routineExerciseIds(routine: DemoRoutine): string[] {
  const ids = new Set<string>();
  for (const index of routine.circuits) {
    for (const exercise of circuitDetails[index].exercises)
      ids.add(exercise.id);
  }
  return [...ids];
}

/**
 * El árbol de la rutina, como lo manda el detalle del alumno. Con `onlyIds` trae solo esos ejercicios y
 * los circuitos que quedan con alguno: es lo que se ve de una rutina que el entrenador quitó del plan,
 * donde el alumno solo ve lo que hizo.
 */
export function routineTree(
  routine: DemoRoutine,
  onlyIds?: ReadonlySet<string>,
): RoutineTree {
  return {
    id: routine.id,
    name: routine.name,
    ...(routine.coachNote && { coach_note: routine.coachNote }),
    active: true,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    circuits: routine.circuits.flatMap((circuitIndex, position) => {
      const circuit = circuitDetails[circuitIndex];
      const exercises = onlyIds
        ? circuit.exercises.filter(({ id }) => onlyIds.has(id))
        : circuit.exercises;
      if (onlyIds && exercises.length === 0) return [];
      return [
        {
          id: `${routine.id}-link-${position + 1}`,
          order: position + 1,
          circuit: { ...circuit, exercises },
        },
      ];
    }),
  };
}
