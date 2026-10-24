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

import { demoAccounts } from './users';

// El home de las cuentas de demo, calculado alrededor de hoy para que siempre haya algo en la semana
// en curso. Franco (el alumno de demo) empezó un plan de 8 semanas hace dos: hoy cursa la 3. Las dos
// primeras están hechas, en la tercera hizo una rutina y media y las demás no empezaron; la segunda
// trae además una rutina que el entrenador quitó del plan. Tiene dos rutinas individuales: una esta
// semana y una la anterior. Lucía tiene una rutina individual hoy y ningún plan; el resto de las
// cuentas, nada (el estado vacío).
const TIMESTAMP = '2026-03-12T12:00:00.000Z';
const PLAN_WEEKS = 8;
const CURRENT_PLAN_WEEK = 3;

const PLAN_ROUTINES = [
  { name: 'Empuje', total: 6 },
  { name: 'Tirón', total: 5 },
  { name: 'Piernas', total: 7 },
];

const franco = demoAccounts[0].user;
const lucia = demoAccounts.find(({ user }) => user.email === 'lucia@email.com');

/** La asignación del plan de Franco: arranca el lunes de hace dos semanas y dura `PLAN_WEEKS`. */
function francoAssignment() {
  const start = addDays(
    mondayOf(toCalendarDay()),
    -(CURRENT_PLAN_WEEK - 1) * 7,
  );
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

/** Los ejercicios que Franco hizo de la rutina `index` en la semana `week` del plan. */
function finishedInPlanWeek(week: number, index: number, total: number) {
  if (week < CURRENT_PLAN_WEEK) return total;
  if (week > CURRENT_PLAN_WEEK) return 0;
  if (index === 0) return total;
  return index === 1 ? 3 : 0;
}

function planRoutines(week: number): RoutineAssignedPlanRoutine[] {
  const routines: RoutineAssignedPlanRoutine[] = PLAN_ROUTINES.map(
    ({ name, total }, index) => ({
      routine_asignation_id: `demo-asignation-w${week}-${index + 1}`,
      order: index + 1,
      active: true,
      routine: { id: `demo-plan-routine-${index + 1}`, name, active: true },
      progress: { finished: finishedInPlanWeek(week, index, total), total },
    }),
  );
  // Una rutina que el entrenador quitó del plan después de que Franco la hiciera: se ve solo lo hecho.
  if (week === 2) {
    routines.push({
      routine_asignation_id: 'demo-asignation-w2-4',
      order: 4,
      active: false,
      routine: {
        id: 'demo-plan-routine-4',
        name: 'Cardio y core',
        active: true,
      },
      progress: { finished: 3, total: 3 },
    });
  }
  return routines;
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

interface IndividualDemo {
  id: string;
  name: string;
  date: string;
  finished: number;
  total: number;
}

function individualDemos(userId: string): IndividualDemo[] {
  const thisMonday = mondayOf(toCalendarDay());
  if (userId === franco.id) {
    return [
      {
        id: 'demo-individual-franco-1',
        name: 'Evaluación inicial',
        date: addDays(thisMonday, -3),
        finished: 5,
        total: 5,
      },
      {
        id: 'demo-individual-franco-2',
        name: 'Movilidad y core',
        date: addDays(thisMonday, 2),
        finished: 0,
        total: 4,
      },
    ];
  }
  if (userId === lucia?.user.id) {
    return [
      {
        id: 'demo-individual-lucia-1',
        name: 'Rutina de adaptación',
        date: toCalendarDay(),
        finished: 2,
        total: 5,
      },
    ];
  }
  return [];
}

function individualRoutines(
  userId: string,
  weekStart: string,
): RoutineAssignedListItem[] {
  const weekEnd = addDays(weekStart, 6);
  return individualDemos(userId)
    .filter(({ date }) => date >= weekStart && date <= weekEnd)
    .map(({ id, name, date, finished, total }) => ({
      id,
      routine_id: `${id}-routine`,
      user_id: userId,
      date,
      created_at: TIMESTAMP,
      updated_at: TIMESTAMP,
      routine: { id: `${id}-routine`, name, active: true },
      progress: { finished, total },
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
