import type {
  AssignedRoutineDetail,
  CircuitDetail,
  PlanSessionDetail,
  StudentRoutineTree,
} from '@/api/pending';
import { queryKeys } from '@/api/queryKeys';
import type { RoutineAssignedFinished } from '@/api/types';
import { formatWeekdayDate } from '@/shared/lib/dates';

import { planWeekText } from './homeWeek';

/** Un ejercicio de una rutina del alumno: el del árbol, con su ficha del catálogo y sus bloques de series. */
export type RoutineExercise = CircuitDetail['exercises'][number];

/**
 * De qué asignación es la rutina que se mira. Define dónde se cachea el detalle y adónde se marca lo
 * que el alumno hizo: lo hecho pertenece a la asignación y no a la rutina, así que una misma rutina
 * asignada dos veces tiene marcas independientes.
 */
export type RoutineAssignment =
  | { kind: 'individual'; assignmentId: string }
  | {
      kind: 'plan';
      userPlanificationId: string;
      routineAsignationId: string;
    };

/** Un texto estable que identifica la asignación: para agrupar mutaciones y guardar el estado de la interfaz. */
export function assignmentKey(assignment: RoutineAssignment): string {
  return assignment.kind === 'individual'
    ? `individual:${assignment.assignmentId}`
    : `plan:${assignment.userPlanificationId}:${assignment.routineAsignationId}`;
}

/** La query key del detalle de la asignación: donde vive lo que el alumno hizo. */
export function assignmentDetailKey(assignment: RoutineAssignment) {
  return assignment.kind === 'individual'
    ? queryKeys.routineDetail.individual(assignment.assignmentId)
    : queryKeys.routineDetail.planSession(
        assignment.userPlanificationId,
        assignment.routineAsignationId,
      );
}

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
  routine: StudentRoutineTree;
  /** De qué asignación es, para marcar lo que el alumno hace y para abrir sus ejercicios. */
  assignment: RoutineAssignment;
  /** Lo que el alumno hizo, por el id de cada ejercicio del árbol (`routine_exercise_id`). */
  finished: ReadonlyMap<string, RoutineAssignedFinished>;
  /** La línea chica sobre el título: el día de la rutina o el plan y su semana. */
  eyebrow: string;
  /** La nota que el entrenador le dejó al alumno al asignarle el plan; las individuales no tienen. */
  planNote: string | null;
  notices: RoutineNotice[];
  /**
   * El entrenador le quitó la planificación al alumno: la sesión se lee pero no se modifica, así que
   * ya no se puede marcar, desmarcar ni anotar (D24 del backend).
   */
  frozen: boolean;
}

/**
 * Qué puede hacer el alumno con los ejercicios de la rutina (CU-U-12 y CU-U-13):
 * - `open`: marcarlos, desmarcarlos y anotarlos.
 * - `frozen`: nada, el entrenador le quitó la planificación. Solo ve los RMs.
 */
export type ExerciseAccess = 'open' | 'frozen';

/**
 * Qué se puede hacer con los ejercicios de la rutina: las individuales y las del plan se marcan igual
 * (cada una con su par de endpoints, en `useExerciseFinished`), salvo que el entrenador le haya quitado
 * la planificación al alumno.
 */
export function exerciseAccess(view: RoutineView): ExerciseAccess {
  return view.frozen ? 'frozen' : 'open';
}

/** Un circuito de la rutina del alumno: el vínculo, con su posición y su circuito. */
export type RoutineCircuitLink = StudentRoutineTree['circuits'][number];

/**
 * Los circuitos de la rutina en orden. Los que el entrenador sacó de la rutina (`order: null`, porque ya no
 * ocupan una posición) van al final, como los manda el backend.
 */
export function sortCircuitLinks(
  circuits: readonly RoutineCircuitLink[],
): RoutineCircuitLink[] {
  return [...circuits].sort((a, b) => {
    if (a.order === null || b.order === null) {
      return Number(a.order === null) - Number(b.order === null);
    }
    return a.order - b.order;
  });
}

/**
 * Cómo se nombra un circuito de la rutina: "Circuito 1 · Empuje" por su lugar en ella. Uno que el
 * entrenador sacó de la rutina ya no tiene lugar: "Sacado de la rutina · Empuje".
 */
export function circuitTitle({ order, circuit }: RoutineCircuitLink): string {
  return order === null
    ? `Sacado de la rutina · ${circuit.name}`
    : `Circuito ${order} · ${circuit.name}`;
}

/** Un ejercicio de la rutina por su `routine_exercise_id`, con el circuito donde aparece primero. */
export function findRoutineExercise(
  routine: StudentRoutineTree,
  routineExerciseId: string,
): { exercise: RoutineExercise; circuit: RoutineCircuitLink } | undefined {
  for (const circuit of sortCircuitLinks(routine.circuits)) {
    const exercise = circuit.circuit.exercises.find(
      ({ id }) => id === routineExerciseId,
    );
    if (exercise) return { exercise, circuit };
  }
  return undefined;
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
    assignment: { kind: 'individual', assignmentId: detail.id },
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
  const weekText = planWeekText(week, planification.duration);

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
    assignment: {
      kind: 'plan',
      userPlanificationId: assignment.id,
      routineAsignationId: detail.routine_asignation_id,
    },
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
