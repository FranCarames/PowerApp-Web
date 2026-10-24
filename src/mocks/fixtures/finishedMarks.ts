import type { RoutineAssignedFinished } from '@/api/types';

import { routineExerciseIds } from './demoRoutines';
import { demoIndividuals, type DemoIndividual } from './demoIndividuals';

// Lo que los alumnos de demo hicieron en sus rutinas, por ejercicio y por asignación (CU-U-12). Las
// rutinas individuales parten de `DemoIndividual.finished` y viven en memoria: marcar o desmarcar un
// ejercicio las cambia, y el home (el progreso) y el detalle salen de acá, así que coinciden. Al
// recargar la página vuelven a como estaban. Las del plan (`routineDetails.ts`) no se marcan: el backend
// publicado todavía no tiene ese endpoint (BE-20c).
const NOTE = 'Subí 2,5 kg respecto de la semana pasada.';

/** Lo que un alumno hizo: los primeros `count` ejercicios, cada uno el día que da `dayOf`. Al primero le dejó una nota. */
export function finishedEntries(
  ids: readonly string[],
  count: number,
  dayOf: (index: number) => string,
): RoutineAssignedFinished[] {
  return ids.slice(0, count).map((id, index) => {
    const day = dayOf(index);
    return {
      routine_exercise_id: id,
      user_note: index === 0 ? NOTE : null,
      finished_at: day,
      created_at: `${day}T12:00:00.000Z`,
      updated_at: `${day}T12:00:00.000Z`,
    };
  });
}

/** Lo hecho de cada rutina individual, por el id de su asignación y luego por el de cada ejercicio. */
const individualMarks = new Map<string, Map<string, RoutineAssignedFinished>>();

function marksOf(demo: DemoIndividual): Map<string, RoutineAssignedFinished> {
  let marks = individualMarks.get(demo.id);
  if (!marks) {
    marks = new Map(
      finishedEntries(
        routineExerciseIds(demo.routine),
        demo.finished,
        () => demo.date,
      ).map((entry) => [entry.routine_exercise_id, entry]),
    );
    individualMarks.set(demo.id, marks);
  }
  return marks;
}

/** Lo que el alumno hizo en la rutina individual. */
export function individualFinished(
  demo: DemoIndividual,
): RoutineAssignedFinished[] {
  return [...marksOf(demo).values()];
}

/** Cuántos ejercicios de la rutina individual están hechos (el progreso del home). */
export function individualFinishedCount(demo: DemoIndividual): number {
  return marksOf(demo).size;
}

/** La rutina individual de demo con ese id de asignación, o `undefined` si no existe. */
export function findDemoIndividual(
  assignmentId: string,
): DemoIndividual | undefined {
  return demoIndividuals().find(({ id }) => id === assignmentId);
}

/** Si el ejercicio es de la rutina individual (el `id` del árbol, no el del catálogo). */
export function individualHasExercise(
  demo: DemoIndividual,
  routineExerciseId: string,
): boolean {
  return routineExerciseIds(demo.routine).includes(routineExerciseId);
}

/**
 * Marca un ejercicio como hecho, como el backend: si no estaba marcado crea la marca (con la nota, si
 * vino); si ya lo estaba, corrige el día y la nota solo si vinieron (la cadena vacía borra la nota).
 */
export function markIndividual(
  demo: DemoIndividual,
  routineExerciseId: string,
  change: { finishedAt?: string; userNote?: string },
): { entry: RoutineAssignedFinished; created: boolean } {
  const marks = marksOf(demo);
  const now = new Date().toISOString();
  const previous = marks.get(routineExerciseId);

  const entry: RoutineAssignedFinished = {
    routine_exercise_id: routineExerciseId,
    finished_at: change.finishedAt ?? previous?.finished_at ?? '',
    user_note:
      change.userNote === undefined
        ? (previous?.user_note ?? null)
        : change.userNote || null,
    created_at: previous?.created_at ?? now,
    updated_at: now,
  };
  marks.set(routineExerciseId, entry);
  return { entry, created: !previous };
}

/** Desmarca un ejercicio y borra su nota. Si no estaba marcado no hace nada. */
export function unmarkIndividual(
  demo: DemoIndividual,
  routineExerciseId: string,
): void {
  marksOf(demo).delete(routineExerciseId);
}

/** Si el ejercicio ya está marcado en la rutina individual. */
export function isIndividualMarked(
  demo: DemoIndividual,
  routineExerciseId: string,
): boolean {
  return marksOf(demo).has(routineExerciseId);
}
