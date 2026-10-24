import { addDays, mondayOf, toCalendarDay } from '@/shared/lib/dates';

import {
  DEMO_ROUTINES,
  routineExerciseIds,
  type DemoRoutine,
} from './demoRoutines';
import { demoAccounts } from './users';

// Las rutinas individuales de las cuentas de demo: a qué alumno pertenecen, qué rutina es y qué día. Cuánto
// hizo cada alumno no se guarda acá sino en `finishedMarks.ts`, que parte de `finished` y cambia cuando el
// alumno marca o desmarca un ejercicio.

export const franco = demoAccounts[0].user;
const lucia = demoAccounts.find(({ user }) => user.email === 'lucia@email.com');

/** Una rutina individual de demo: de quién es, qué día y cuántos ejercicios tenía hechos al empezar. */
export interface DemoIndividual {
  id: string;
  userId: string;
  routine: DemoRoutine;
  date: string;
  /** Los primeros `finished` ejercicios de la rutina vienen hechos. */
  finished: number;
}

/** Las rutinas individuales de todas las cuentas de demo. */
export function demoIndividuals(): DemoIndividual[] {
  const thisMonday = mondayOf(toCalendarDay());
  return [
    {
      id: 'demo-individual-franco-1',
      userId: franco.id,
      routine: DEMO_ROUTINES.evaluation,
      date: addDays(thisMonday, -3),
      finished: routineExerciseIds(DEMO_ROUTINES.evaluation).length,
    },
    {
      id: 'demo-individual-franco-2',
      userId: franco.id,
      routine: DEMO_ROUTINES.mobility,
      date: addDays(thisMonday, 2),
      finished: 0,
    },
    ...(lucia
      ? [
          {
            id: 'demo-individual-lucia-1',
            userId: lucia.user.id,
            routine: DEMO_ROUTINES.adaptation,
            date: toCalendarDay(),
            finished: 2,
          },
        ]
      : []),
  ];
}
