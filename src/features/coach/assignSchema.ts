import { z } from 'zod';

import type { AssignPlanificationBody } from '@/api/types';
import { addDays, isCalendarDay, mondayOf } from '@/shared/lib/dates';

// El formulario de asignar una planificación a un alumno (CU-E-13): `AssignPlanificationToUserDto` sin el
// alumno y la planificación, que se eligen aparte. El inicio es obligatorio y puede ser pasado o futuro (el
// servidor no calcula "hoy"). El fin es opcional: sin él lo calcula el backend desde la duración del plan, y
// con un plan de duración 0 es obligatorio. No puede ser anterior al inicio. La nota tiene hasta 100
// caracteres y, vacía, no se manda (la cadena vacía da 400). Las fechas son textos `YYYY-MM-DD`: un
// <input type="date"> entrega eso, o "" si está vacío o incompleto.

/** El máximo de la nota del entrenador, el del contrato. */
export const ASSIGN_NOTE_MAX = 100;

type AssignDates = Pick<
  AssignPlanificationBody,
  'start_date' | 'end_date' | 'coach_note'
>;

/**
 * El fin que calcula el backend cuando no se lo indica: el domingo de la semana `duration`, contando como
 * semana 1 la de lunes a domingo que contiene el inicio. `null` si el plan no tiene duración fija o el
 * inicio no es un día válido.
 */
export function defaultEndDate(start: string, duration: number): string | null {
  if (duration <= 0 || !isCalendarDay(start)) return null;
  return addDays(mondayOf(start), 7 * duration - 1);
}

/** El schema del formulario para un plan de esa duración (semanas; 0 es sin duración fija). */
export function assignPlanSchema(duration: number) {
  return z
    .object({
      start_date: z.string(),
      end_date: z.string(),
      coach_note: z
        .string()
        .trim()
        .max(
          ASSIGN_NOTE_MAX,
          `La nota no puede tener más de ${ASSIGN_NOTE_MAX} caracteres`,
        ),
    })
    .superRefine(({ start_date, end_date }, context) => {
      const validStart = isCalendarDay(start_date);
      if (!validStart) {
        context.addIssue({
          code: 'custom',
          path: ['start_date'],
          message: 'Elegí el día de inicio',
        });
      }
      if (end_date === '') {
        if (duration === 0) {
          context.addIssue({
            code: 'custom',
            path: ['end_date'],
            message:
              'Este plan no tiene duración fija: indicá hasta cuándo dura',
          });
        }
      } else if (!isCalendarDay(end_date)) {
        context.addIssue({
          code: 'custom',
          path: ['end_date'],
          message: 'Elegí un día de fin válido',
        });
      } else if (validStart && end_date < start_date) {
        context.addIssue({
          code: 'custom',
          path: ['end_date'],
          message: 'El fin no puede ser anterior al inicio',
        });
      }
    })
    .transform(({ start_date, end_date, coach_note }): AssignDates => ({
      start_date,
      ...(end_date && { end_date }),
      ...(coach_note && { coach_note }),
    }));
}

export type AssignPlanInput = z.input<ReturnType<typeof assignPlanSchema>>;
export type AssignPlanValues = z.output<ReturnType<typeof assignPlanSchema>>;
