import type { UserRmWithExercise } from '@/api/pending';

import { exercises } from './exercises';
import { students } from './students';

// Los RMs de los alumnos de demo, con la forma que manda el backend (cada uno con su ejercicio y su
// alumno anidados, sin `exercise_id` ni `user_id`: V10). Las fechas son relativas a hoy, para que el
// historial se vea igual sin importar el día en que se mire.
//
// Todos parten del mismo perfil (el de Franco, con cinco ejercicios) escalado por alumno y con menos
// ejercicios para los demás. Franco tiene los cinco, Lucía Gómez dos y Martín Pérez ninguno (es el
// estado vacío).

const DAY = 24 * 60 * 60 * 1000;

/** [peso en kg, repeticiones, hace cuántos días]. */
type Entry = [number, number, number];

// Cada ejercicio con su historial, del más reciente al más antiguo. Hay ejercicios con más de un RM el
// mismo día (un 1RM y uno de 5 repeticiones) para probar el orden dentro del grupo.
const PROFILE: Array<[string, Entry[]]> = [
  [
    'Press de banca',
    [
      [85.5, 5, 6],
      [100, 1, 6],
      [82.5, 5, 40],
      [80, 5, 75],
    ],
  ],
  [
    'Sentadilla',
    [
      [120, 5, 9],
      [135, 1, 30],
      [115, 5, 44],
    ],
  ],
  [
    'Peso muerto',
    [
      [140, 3, 14],
      [135, 3, 50],
    ],
  ],
  ['Remo con barra', [[80, 8, 3]]],
  ['Press militar', [[52.5, 6, 12]]],
];

/** Un día de calendario "YYYY-MM-DD", como la columna `date` del backend (sin hora). */
function calendarDay(daysAgo: number): string {
  const date = new Date(Date.now() - daysAgo * DAY);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function exerciseOf(name: string): { id: string; name: string } {
  const exercise = exercises.find((candidate) => candidate.name === name);
  if (!exercise) throw new Error(`Falta el ejercicio de demo "${name}"`);
  return { id: exercise.id, name: exercise.name };
}

function rmsFor(
  student: { id: string; first_name: string; last_name: string },
  exerciseCount: number,
  scale: number,
): UserRmWithExercise[] {
  const { id, first_name, last_name } = student;
  return PROFILE.slice(0, exerciseCount).flatMap(([name, entries]) =>
    entries.map(([weight, reps, daysAgo], index) => {
      const created = new Date(Date.now() - daysAgo * DAY).toISOString();
      return {
        id: `demo-rm-${id}-${name}-${index}`,
        // En saltos de 2,5 kg, como se cargan los discos.
        weight: Math.round((weight * scale) / 2.5) * 2.5,
        reps,
        date: calendarDay(daysAgo),
        created_at: created,
        updated_at: created,
        exercise: exerciseOf(name),
        user: { id, first_name, last_name },
      };
    }),
  );
}

/** Los RMs de un alumno de demo, sin ordenar (como los devuelve el backend). Un id desconocido no tiene ninguno. */
export function demoRmsFor(userId: string): UserRmWithExercise[] {
  const position = students.findIndex(({ id }) => id === userId);
  if (position < 0) return [];
  const student = students[position];

  // Franco, Lucía y Martín, las tres cuentas de demo, son los últimos de `students`.
  const last = students.length - 1;
  if (position === last - 2) return rmsFor(student, PROFILE.length, 1);
  if (position === last - 1) return rmsFor(student, 2, 0.6);
  if (position === last) return [];

  // Los demás: de 1 a 5 ejercicios y entre el 60 % y el 110 % del perfil. Cada 6.º no cargó ninguno.
  if (position % 6 === 5) return [];
  return rmsFor(student, 1 + (position % 5), 0.6 + (position % 6) * 0.1);
}
