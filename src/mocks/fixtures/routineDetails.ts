import type { AssignedRoutineDetail, PlanSessionDetail } from '@/api/pending';
import type { RoutineAssignedFinished } from '@/api/types';
import { addDays, toCalendarDay } from '@/shared/lib/dates';

import { routineExerciseIds, routineTree } from './demoRoutines';
import {
  PLAN_WEEKS,
  demoIndividuals,
  francoAssignment,
  planSessions,
  planWeekStart,
} from './home';

// El detalle de las rutinas de demo. Sale de las mismas sesiones que el home (`home.ts`): de cada una,
// los primeros `finished` ejercicios del árbol están hechos, así que el progreso coincide. Al primero
// de cada rutina el alumno le dejó una nota.
const TIMESTAMP = '2026-03-12T12:00:00.000Z';
const NOTE = 'Subí 2,5 kg respecto de la semana pasada.';

/** Lo que Franco hizo: los primeros `count` ejercicios, cada uno el día que da `dayOf`. */
function finishedEntries(
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

/** El detalle de una rutina individual de demo y de quién es, o `undefined` si no existe. */
export function demoIndividualDetail(
  assignmentId: string,
): { userId: string; detail: AssignedRoutineDetail } | undefined {
  const demo = demoIndividuals().find(({ id }) => id === assignmentId);
  if (!demo) return undefined;
  const ids = routineExerciseIds(demo.routine);
  return {
    userId: demo.userId,
    detail: {
      id: demo.id,
      routine_id: demo.routine.id,
      user_id: demo.userId,
      date: demo.date,
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
      routine: routineTree(demo.routine),
      finished: finishedEntries(ids, demo.finished, () => demo.date),
    },
  };
}

/** Los dos números de una rutina del plan de demo: `demo-asignation-w3-2` es la segunda de la semana 3. */
function parseAsignationId(
  routineAsignationId: string,
): { week: number; order: number } | undefined {
  const match = /^demo-asignation-w(\d+)-(\d+)$/.exec(routineAsignationId);
  if (!match) return undefined;
  const week = Number(match[1]);
  return week >= 1 && week <= PLAN_WEEKS
    ? { week, order: Number(match[2]) }
    : undefined;
}

/**
 * El detalle de una rutina de una semana del plan de Franco. `'no-assignment'` si la asignación no es la
 * suya, `'not-in-plan'` si la rutina no es de esa semana, y `'removed'` si el entrenador la quitó del plan
 * y Franco no hizo nada en ella.
 */
export function demoPlanSessionDetail(
  userPlanificationId: string,
  routineAsignationId: string,
): PlanSessionDetail | 'no-assignment' | 'not-in-plan' | 'removed' {
  const assignment = francoAssignment();
  if (userPlanificationId !== assignment.id) return 'no-assignment';

  const parsed = parseAsignationId(routineAsignationId);
  const session = parsed
    ? planSessions(parsed.week).find(
        (item) => item.routineAsignationId === routineAsignationId,
      )
    : undefined;
  if (!parsed || !session) return 'not-in-plan';
  if (session.removed && session.finished === 0) return 'removed';

  const weekStart = planWeekStart(parsed.week);
  const today = toCalendarDay();
  const ids = routineExerciseIds(session.routine);
  const done = new Set(ids.slice(0, session.finished));
  return {
    user_planification: { ...assignment, active: true },
    routine_asignation_id: session.routineAsignationId,
    week: parsed.week,
    week_start: weekStart,
    week_end: addDays(weekStart, 6),
    order: session.order,
    active: !session.removed,
    // De una rutina quitada del plan solo se ve lo que se hizo.
    routine: routineTree(session.routine, session.removed ? done : undefined),
    finished: finishedEntries(ids, session.finished, (index) => {
      const day = addDays(weekStart, index);
      return day > today ? today : day;
    }),
  };
}
