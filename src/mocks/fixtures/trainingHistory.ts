import type {
  CircuitSetResponse,
  RoutineHistoryExercise,
  RoutineHistoryIndividualSession,
  RoutineHistorySession,
  RoutineHistorySet,
} from '@/api/types';
import { addDays, toCalendarDay } from '@/shared/lib/dates';

import { circuitDetails } from './circuits';
import { demoIndividuals } from './demoIndividuals';
import {
  DEMO_ROUTINES,
  routineExerciseIds,
  type DemoRoutine,
} from './demoRoutines';
import { individualFinished } from './finishedMarks';
import { students } from './students';

// El historial de entrenamientos de los alumnos de demo (`GET /routine/history/{userId}`, B6), con la forma
// que manda el backend: sesiones individuales, de la más nueva a la más vieja, cada una con los ejercicios
// que el alumno hizo y las series de la rutina (la prescripción, no lo que levantó).
//
// Hay dos orígenes:
// - Los alumnos de las cuentas de demo (Franco y Lucía Gómez) salen de lo que hicieron en sus rutinas
//   individuales (`finishedMarks.ts`), así que coinciden con el home y el detalle y cambian cuando marcan o
//   desmarcan un ejercicio.
// - Lucía Méndez y Tomás Ríos, que son solo alumnos de la lista del entrenador, traen sesiones propias de
//   fechas relativas a hoy: el primero con casi tres semanas de historia (para la paginación y el filtro).
// Los demás no entrenaron: es el estado vacío.
//
// Las sesiones del plan no están: el backend publicado todavía no las devuelve (BE-20d).

/** Los ejercicios de las rutinas por el id del `Routine_Exercise`, con su ficha del catálogo y sus series. */
const routineExercises = new Map(
  circuitDetails.flatMap((circuit) =>
    circuit.exercises.map((exercise) => [exercise.id, exercise] as const),
  ),
);

function historySet(set: CircuitSetResponse): RoutineHistorySet {
  return {
    set_order: set.set_order,
    set_count: set.set_count,
    rep_count: set.rep_count,
    weight: set.weight ?? null,
    rm_perc: set.rm_perc ?? null,
    rpe: set.rpe ?? null,
    rir: set.rir ?? null,
    amrap: set.amrap,
    amrap_time: set.amrap_time ?? null,
    rm: set.rm,
  };
}

/** Un ejercicio hecho, con la prescripción actual de la rutina. `undefined` si el id no es de ninguna. */
function historyExercise(
  routineExerciseId: string,
  finishedAt: string,
  userNote: string | null,
): RoutineHistoryExercise | undefined {
  const found = routineExercises.get(routineExerciseId);
  if (!found) return undefined;
  return {
    routine_exercise_id: routineExerciseId,
    exercise: { id: found.exercise.id, name: found.exercise.name },
    user_note: userNote,
    finished_at: finishedAt,
    sets: [...found.sets]
      .sort((a, b) => a.set_order - b.set_order)
      .map(historySet),
  };
}

function present<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/** Las sesiones de las rutinas individuales de la cuenta de demo, con lo que marcó hasta ahora. */
function individualSessions(userId: string): RoutineHistoryIndividualSession[] {
  return demoIndividuals()
    .filter((demo) => demo.userId === userId)
    .flatMap((demo) => {
      // Por el día en que los hizo y, el mismo día, en el orden en que los marcó.
      const exercises = individualFinished(demo)
        .sort(
          (a, b) =>
            a.finished_at.localeCompare(b.finished_at) ||
            a.created_at.localeCompare(b.created_at),
        )
        .map((mark) =>
          historyExercise(
            mark.routine_exercise_id,
            mark.finished_at,
            mark.user_note ?? null,
          ),
        )
        .filter(present);
      if (exercises.length === 0) return [];
      return [
        {
          source: 'individual' as const,
          assignment_id: demo.id,
          date: demo.date,
          routine: { id: demo.routine.id, name: demo.routine.name },
          exercises,
        },
      ];
    });
}

/** Una sesión armada a mano: de qué rutina, hace cuántos días y qué hizo. */
interface PastSession {
  routine: DemoRoutine;
  daysAgo: number;
  /** Cuántos ejercicios hizo: los primeros de la rutina. */
  done: number;
  /** Las notas del alumno, por la posición del ejercicio en la rutina. */
  notes?: Record<number, string>;
  /** Los ejercicios que hizo al día siguiente de la rutina, por su posición (marcó en diferido). */
  late?: readonly number[];
}

const { push, pull, legs, conditioning, evaluation, adaptation } =
  DEMO_ROUTINES;
const ALL = Number.POSITIVE_INFINITY;

const PAST_SESSIONS: Record<string, readonly PastSession[]> = {
  'lucia.mendez@email.com': [
    {
      routine: push,
      daysAgo: 1,
      done: ALL,
      notes: { 0: 'Subí 2,5 kg en el press de banca.' },
    },
    {
      routine: pull,
      daysAgo: 3,
      done: ALL,
      notes: { 1: 'Me molestó un poco el codo en la última serie.' },
    },
    { routine: legs, daysAgo: 5, done: ALL },
    // El mismo día que "Empuje": dos sesiones, ordenadas por el nombre de la rutina.
    { routine: push, daysAgo: 8, done: 3, late: [2] },
    { routine: conditioning, daysAgo: 8, done: ALL },
    { routine: pull, daysAgo: 10, done: ALL },
    {
      routine: legs,
      daysAgo: 12,
      done: 2,
      notes: { 0: 'Sentadilla pesada, bajé la carga al final.' },
    },
    { routine: push, daysAgo: 15, done: ALL },
    { routine: pull, daysAgo: 17, done: ALL },
    { routine: legs, daysAgo: 19, done: ALL },
    { routine: push, daysAgo: 22, done: ALL },
    { routine: pull, daysAgo: 24, done: 3 },
    { routine: legs, daysAgo: 26, done: ALL },
    { routine: push, daysAgo: 29, done: ALL },
  ],
  'tomas.rios@email.com': [
    { routine: evaluation, daysAgo: 6, done: ALL },
    {
      routine: adaptation,
      daysAgo: 2,
      done: 1,
      notes: { 0: 'Primera vez con peso muerto. Fui liviano.' },
    },
  ],
};

function pastSessions(userId: string): RoutineHistoryIndividualSession[] {
  const student = students.find(({ id }) => id === userId);
  const sessions = student ? PAST_SESSIONS[student.email] : undefined;
  if (!sessions) return [];

  const today = toCalendarDay();
  return sessions.flatMap(({ routine, daysAgo, done, notes, late }, index) => {
    const date = addDays(today, -daysAgo);
    const exercises = routineExerciseIds(routine)
      .slice(0, done)
      .map((id, position) =>
        historyExercise(
          id,
          late?.includes(position) ? addDays(date, 1) : date,
          notes?.[position] ?? null,
        ),
      )
      .filter(present)
      // Por el día en que los hizo; el sort es estable, así que el mismo día queda en el orden de la rutina.
      .sort((a, b) => a.finished_at.localeCompare(b.finished_at));
    return [
      {
        source: 'individual' as const,
        assignment_id: `demo-past-${userId}-${index + 1}`,
        date,
        routine: { id: routine.id, name: routine.name },
        exercises,
      },
    ];
  });
}

/**
 * El historial de entrenamientos de un usuario, como el endpoint: de la sesión más nueva a la más vieja
 * (día descendente y, el mismo día, por el nombre de la rutina). Con `exerciseId` quedan solo las sesiones
 * donde hizo ese ejercicio y, en cada una, únicamente ese. Un usuario sin sesiones, o un ejercicio que no
 * hizo (o que no existe), es una lista vacía.
 */
export function trainingHistoryFor(
  userId: string,
  exerciseId?: string,
): RoutineHistorySession[] {
  const sessions = [
    ...individualSessions(userId),
    ...pastSessions(userId),
  ].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      a.routine.name.localeCompare(b.routine.name, 'es'),
  );
  if (!exerciseId) return sessions;

  return sessions.flatMap((session) => {
    const exercises = session.exercises.filter(
      ({ exercise }) => exercise.id === exerciseId,
    );
    return exercises.length > 0 ? [{ ...session, exercises }] : [];
  });
}
