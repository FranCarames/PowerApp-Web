import type {
  RoutineAssignedListItem,
  RoutineAssignedPlanRoutine,
  RoutineAssignedPlanWeek,
  RoutineHomeWeek,
} from '@/api/types';
import {
  addDays,
  mondayOf,
  toCalendarDay,
  weeksBetween,
} from '@/shared/lib/dates';

import {
  DEMO_ROUTINES,
  routineExerciseIds,
  type DemoRoutine,
} from './demoRoutines';
import { demoIndividuals, franco } from './demoIndividuals';
import { individualFinishedCount } from './finishedMarks';

// El home de las cuentas de demo, calculado alrededor de hoy para que siempre haya algo en la semana
// en curso. Franco (el alumno de demo) empezó un plan de 8 semanas hace dos: hoy cursa la 3. Las dos
// primeras están hechas, en la tercera hizo una rutina y casi otra y las demás no empezaron; la segunda
// trae además una rutina que el entrenador quitó del plan. Tiene dos rutinas individuales: una esta
// semana y una la anterior. Lucía tiene una rutina individual hoy y ningún plan; el resto de las
// cuentas, nada (el estado vacío). El detalle de cada rutina sale de las mismas sesiones
// (`routineDetails.ts`), así que el progreso de acá coincide con lo que allá se ve.
const TIMESTAMP = '2026-03-12T12:00:00.000Z';
export const PLAN_WEEKS = 8;
const CURRENT_PLAN_WEEK = 3;

/** El lunes en que arrancó el plan de Franco: hace dos semanas. */
function planStart(): string {
  return addDays(mondayOf(toCalendarDay()), -(CURRENT_PLAN_WEEK - 1) * 7);
}

/** El lunes de la semana `week` del plan de Franco. */
export function planWeekStart(week: number): string {
  return addDays(planStart(), (week - 1) * 7);
}

/** La asignación del plan de Franco: arranca el lunes de hace dos semanas y dura `PLAN_WEEKS`. */
export function francoAssignment() {
  const start = planStart();
  return {
    id: 'demo-user-planification-franco',
    start_date: start,
    end_date: addDays(start, PLAN_WEEKS * 7 - 1),
    coach_note: 'Subí el peso solo si te salen todas las series.',
    planification: {
      id: 'demo-planification-1',
      name: 'Fuerza 5×5',
      duration: PLAN_WEEKS,
      active: true,
    },
  };
}

/** Una rutina de una semana del plan de Franco: cuánto hizo y si el entrenador la quitó del plan. */
export interface DemoPlanSession {
  routineAsignationId: string;
  order: number;
  routine: DemoRoutine;
  removed: boolean;
  finished: number;
  total: number;
}

/** Los ejercicios que Franco hizo de la rutina `index` en la semana `week` del plan. */
function finishedInPlanWeek(week: number, index: number, total: number) {
  if (week < CURRENT_PLAN_WEEK) return total;
  if (week > CURRENT_PLAN_WEEK) return 0;
  if (index === 0) return total;
  return index === 1 ? Math.min(3, total) : 0;
}

/** Las rutinas de la semana `week` del plan de Franco, en el orden del entrenador. */
export function planSessions(week: number): DemoPlanSession[] {
  const inOrder = [DEMO_ROUTINES.push, DEMO_ROUTINES.pull, DEMO_ROUTINES.legs];
  const sessions = inOrder.map((routine, index): DemoPlanSession => {
    const total = routineExerciseIds(routine).length;
    return {
      routineAsignationId: `demo-asignation-w${week}-${index + 1}`,
      order: index + 1,
      routine,
      removed: false,
      finished: finishedInPlanWeek(week, index, total),
      total,
    };
  });
  // Una rutina que el entrenador quitó del plan después de que Franco hiciera parte: se ve solo lo hecho,
  // así que su total es lo que hizo.
  if (week === 2) {
    sessions.push({
      routineAsignationId: 'demo-asignation-w2-4',
      order: 4,
      routine: DEMO_ROUTINES.conditioning,
      removed: true,
      finished: 2,
      total: 2,
    });
  }
  return sessions;
}

function planRoutines(week: number): RoutineAssignedPlanRoutine[] {
  return planSessions(week).map((session) => ({
    routine_asignation_id: session.routineAsignationId,
    order: session.order,
    active: !session.removed,
    routine: {
      id: session.routine.id,
      name: session.routine.name,
      active: true,
    },
    progress: { finished: session.finished, total: session.total },
  }));
}

function planGroups(
  userId: string,
  weekStart: string,
): RoutineAssignedPlanWeek[] {
  if (userId !== franco.id) return [];
  const assignment = francoAssignment();
  const week = weeksBetween(assignment.start_date, weekStart) + 1;
  if (week < 1 || week > PLAN_WEEKS) return [];
  return [
    {
      user_planification: assignment,
      week,
      week_start: weekStart,
      week_end: addDays(weekStart, 6),
      routines: planRoutines(week),
    },
  ];
}

function individualRoutines(
  userId: string,
  weekStart: string,
): RoutineAssignedListItem[] {
  const weekEnd = addDays(weekStart, 6);
  return demoIndividuals()
    .filter(
      (demo) =>
        demo.userId === userId &&
        demo.date >= weekStart &&
        demo.date <= weekEnd,
    )
    .map((demo) => ({
      id: demo.id,
      routine_id: demo.routine.id,
      user_id: userId,
      date: demo.date,
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
      routine: {
        id: demo.routine.id,
        name: demo.routine.name,
        active: true,
      },
      // Sale de lo que el alumno marcó, así que cambia cuando marca o desmarca un ejercicio.
      progress: {
        finished: individualFinishedCount(demo),
        total: routineExerciseIds(demo.routine).length,
      },
    }));
}

/**
 * Lo que responde `GET /routine/home/{userId}`: siempre `weeks` semanas seguidas, de lunes a domingo,
 * desde la del día `date`, aunque estén vacías.
 */
export function demoHomeWeeks(
  userId: string,
  date: string,
  weeks: number,
): RoutineHomeWeek[] {
  const first = mondayOf(date);
  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = addDays(first, index * 7);
    return {
      week_start: weekStart,
      week_end: addDays(weekStart, 6),
      individual: individualRoutines(userId, weekStart),
      plan: planGroups(userId, weekStart),
    };
  });
}
