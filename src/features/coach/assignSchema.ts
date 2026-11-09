import { z } from 'zod';

import type { AssignPlanificationBody } from '@/api/types';
import { parseCount } from '@/features/catalog/planRoutines';
import { addDays, isCalendarDay, mondayOf } from '@/shared/lib/dates';

// El formulario de asignar una planificación a un alumno (CU-E-13): `AssignPlanificationToUserDto` sin el
// alumno y la planificación, que se eligen aparte. El inicio es obligatorio y puede ser pasado o futuro (el
// servidor no calcula "hoy"). En lugar del fin se eligen las semanas (por defecto, la duración del plan), y
// el fin es el domingo de la última: la web lo manda siempre, aunque el contrato lo deja opcional. La nota
// tiene hasta 100 caracteres y, vacía, no se manda (la cadena vacía da 400). El inicio es un texto
// `YYYY-MM-DD`, como lo entrega un <input type="date"> ("" si está vacío o incompleto), y las semanas, lo
// que hay escrito en el campo.

/** El máximo de la nota del entrenador, el del contrato. */
export const ASSIGN_NOTE_MAX = 100;

type AssignDates = Required<
  Pick<AssignPlanificationBody, 'start_date' | 'end_date'>
> &
  Pick<AssignPlanificationBody, 'coach_note'>;

/**
 * El fin de una asignación de `weeks` semanas: el domingo de la semana `weeks`, contando como semana 1 la
 * de lunes a domingo que contiene el inicio. Es también el que calcula el backend cuando no se lo indica,
 * con la duración del plan. `null` si no hay semanas o el inicio no es un día válido.
 */
export function defaultEndDate(start: string, weeks: number): string | null {
  if (weeks <= 0 || !isCalendarDay(start)) return null;
  return addDays(mondayOf(start), 7 * weeks - 1);
}

/**
 * El fin que resulta del inicio y de lo escrito en «Semanas», o `null` si alguno de los dos no es válido o
 * el fin cae fuera del calendario (un inicio a fines del año 9999).
 */
export function assignEndDate(start: string, weeks: string): string | null {
  const end = defaultEndDate(start, parseCount(weeks));
  return end !== null && isCalendarDay(end) ? end : null;
}

/** El schema del formulario: el inicio, las semanas y la nota, y el body con el fin que resulta. */
export const assignPlanSchema = z
  .object({
    start_date: z.string(),
    weeks: z.string(),
    coach_note: z
      .string()
      .trim()
      .max(
        ASSIGN_NOTE_MAX,
        `La nota no puede tener más de ${ASSIGN_NOTE_MAX} caracteres`,
      ),
  })
  .superRefine(({ start_date, weeks }, context) => {
    const validStart = isCalendarDay(start_date);
    if (!validStart) {
      context.addIssue({
        code: 'custom',
        path: ['start_date'],
        message: 'Elegí el día de inicio',
      });
    }
    if (weeks.trim() === '') {
      context.addIssue({
        code: 'custom',
        path: ['weeks'],
        message: 'Indicá cuántas semanas dura',
      });
    } else if (parseCount(weeks) === 0) {
      context.addIssue({
        code: 'custom',
        path: ['weeks'],
        message: 'Poné un número entero de semanas, de 1 en adelante',
      });
    } else if (validStart && assignEndDate(start_date, weeks) === null) {
      context.addIssue({
        code: 'custom',
        path: ['weeks'],
        message:
          'Con ese inicio el fin queda fuera del calendario: poné menos semanas o un inicio anterior',
      });
    }
  })
  .transform(({ start_date, weeks, coach_note }, context): AssignDates => {
    const end_date = assignEndDate(start_date, weeks);
    // No pasa: con un problema arriba el transform no corre. Está para que el fin nunca vaya vacío.
    if (end_date === null) {
      context.addIssue({
        code: 'custom',
        path: ['weeks'],
        message: 'Indicá cuántas semanas dura',
      });
      return z.NEVER;
    }
    return { start_date, end_date, ...(coach_note && { coach_note }) };
  });

export type AssignPlanInput = z.input<typeof assignPlanSchema>;
export type AssignPlanValues = z.output<typeof assignPlanSchema>;
