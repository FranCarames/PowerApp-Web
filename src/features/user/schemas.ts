import { z } from 'zod';

import { toCalendarDay } from '@/shared/lib/dates';

/** Un peso de la barra más los discos no pasa de acá; el DTO no pone tope, pero la columna no es para cualquier número. */
const MAX_WEIGHT = 1000;
/** Un RM es una serie corta: con más repeticiones ya no mide fuerza máxima. El DTO no pone tope. */
const MAX_REPS = 100;

/** Una fecha "YYYY-MM-DD" que existe en el calendario (rechaza el 31 de febrero). */
function isCalendarDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * `CreateUserRmDto` y `EditUserRmDto`, que tienen las mismas reglas (CU-U-17 y CU-U-18). El `user_id`
 * no se pide: sale de la sesión. En el formulario el peso y las repeticiones son textos (los campos
 * numéricos entregan texto) y el schema los convierte a número.
 *
 * - `weight`: positivo, con hasta dos decimales y `@Min(0.99)` en el DTO, que acá se pide como "1 kg o
 *   más" para que el mensaje no hable de 0,99.
 * - `reps`: entero de 1 en adelante.
 * - `date`: un día de calendario, no futuro (el DTO solo pide una fecha válida).
 *
 * Los topes de 1.000 kg y de 100 repeticiones son del front.
 */
export const rmSchema = z.object({
  exercise_id: z.string().min(1, 'Elegí un ejercicio'),
  weight: z
    .string()
    .trim()
    .min(1, 'Ingresá el peso')
    .refine(
      (value) =>
        /^\d+([.,]\d{1,2})?$/.test(value) &&
        Number(value.replace(',', '.')) >= 0.99,
      'Ingresá un peso de 1 kg o más, con hasta dos decimales',
    )
    .transform((value) => Number(value.replace(',', '.')))
    .refine(
      (value) => value <= MAX_WEIGHT,
      `El peso no puede pasar de ${MAX_WEIGHT.toLocaleString('es-AR')} kg`,
    ),
  reps: z
    .string()
    .trim()
    .min(1, 'Ingresá las repeticiones')
    .refine(
      (value) => /^\d+$/.test(value) && Number(value) >= 1,
      'Las repeticiones son un número entero, de 1 en adelante',
    )
    .transform(Number)
    .refine(
      (value) => value <= MAX_REPS,
      `Las repeticiones no pueden pasar de ${MAX_REPS}`,
    ),
  date: z
    .string()
    .min(1, 'Elegí la fecha')
    .refine(isCalendarDay, 'Ingresá una fecha válida')
    // Los días de calendario "YYYY-MM-DD" se ordenan como texto.
    .refine(
      (value) => value <= toCalendarDay(),
      'La fecha no puede ser futura',
    ),
});

export type RmInput = z.input<typeof rmSchema>;
export type RmValues = z.output<typeof rmSchema>;
