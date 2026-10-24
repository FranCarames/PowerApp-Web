import type {
  AssignedRoutineDetail,
  PlanSessionDetail,
  RoutineTree,
} from '@/api/pending';
import type { RoutineAssignedFinished } from '@/api/types';
import { formatWeekdayDate } from '@/shared/lib/dates';

/** Un aviso sobre la asignación: `warn` es algo que limita lo que el alumno puede hacer; `acc`, algo informativo. */
export interface RoutineNotice {
  tone: 'acc' | 'warn';
  text: string;
}

/**
 * Lo que la pantalla del detalle necesita de una rutina del alumno, venga de una asignación individual
 * o de una semana del plan: las dos respuestas se llevan a esta misma forma.
 */
export interface RoutineView {
  routine: RoutineTree;
  /** Lo que el alumno hizo, por el id de cada ejercicio del árbol (`routine_exercise_id`). */
  finished: ReadonlyMap<string, RoutineAssignedFinished>;
  /** La línea chica sobre el título: el día de la rutina o el plan y su semana. */
  eyebrow: string;
  /** La nota que el entrenador le dejó al alumno al asignarle el plan; las individuales no tienen. */
  planNote: string | null;
  notices: RoutineNotice[];
  /**
   * El entrenador le quitó la planificación al alumno: la sesión se lee pero no se modifica, así que
   * ya no se puede marcar, desmarcar ni anotar (D24 del backend). Lo usa T40.
   */
  frozen: boolean;
}

const ROUTINE_INACTIVE =
  'Esta rutina fue dada de baja, pero podés seguir entrenándola.';

function finishedById(
  finished: readonly RoutineAssignedFinished[],
): Map<string, RoutineAssignedFinished> {
  return new Map(finished.map((item) => [item.routine_exercise_id, item]));
}

/** La vista de una rutina individual (`GET /routine/assign-user/{id}`). */
export function individualView(detail: AssignedRoutineDetail): RoutineView {
  return {
    routine: detail.routine,
    finished: finishedById(detail.finished),
    eyebrow: formatWeekdayDate(detail.date),
    planNote: null,
    notices: detail.routine.active
      ? []
      : [{ tone: 'acc', text: ROUTINE_INACTIVE }],
    frozen: false,
  };
}

/** La vista de una rutina de una semana del plan (`GET /routine/assign-plan/{up}/{ra}`). */
export function planSessionView(detail: PlanSessionDetail): RoutineView {
  const { user_planification: assignment, week } = detail;
  const { planification } = assignment;
  const planName = planification.name ?? 'Planificación';
  const weekText =
    planification.duration > 0
      ? `Semana ${week} de ${planification.duration}`
      : `Semana ${week}`;

  const notices: RoutineNotice[] = [];
  if (!assignment.active) {
    notices.push({
      tone: 'warn',
      text: 'Tu entrenador te quitó esta planificación. Podés ver lo que hiciste, pero ya no se puede marcar ni anotar.',
    });
  }
  if (!detail.active) {
    notices.push({
      tone: 'warn',
      text: 'Tu entrenador quitó esta rutina del plan. Ves solo los ejercicios que ya hiciste.',
    });
  }
  if (!planification.active) {
    notices.push({
      tone: 'acc',
      text: 'Esta planificación fue dada de baja, pero podés seguir entrenando.',
    });
  }
  if (!detail.routine.active) {
    notices.push({ tone: 'acc', text: ROUTINE_INACTIVE });
  }

  return {
    routine: detail.routine,
    finished: finishedById(detail.finished),
    eyebrow: `${planName} · ${weekText}`,
    planNote: assignment.coach_note,
    notices,
    frozen: !assignment.active,
  };
}

/**
 * Los números de una rutina: cuántos ejercicios tiene, cuántas series suman y cuántos ejercicios hizo.
 * Cada ejercicio cuenta una vez aunque su circuito se repita en la rutina, como el progreso del home
 * (`finished` y `total` cuentan los ejercicios sin repetir ids).
 */
export function routineStats({ routine, finished }: RoutineView): {
  exercises: number;
  sets: number;
  done: number;
} {
  const seen = new Set<string>();
  let sets = 0;
  let done = 0;
  for (const { circuit } of routine.circuits) {
    for (const exercise of circuit.exercises) {
      if (seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      sets += exercise.sets.reduce((sum, block) => sum + block.set_count, 0);
      if (finished.has(exercise.id)) done += 1;
    }
  }
  return { exercises: seen.size, sets, done };
}
