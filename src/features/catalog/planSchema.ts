import { z, type RefinementCtx } from 'zod';

import type { EditPlanificationBody, PlanificationDetail } from '@/api/types';

// El formulario de la cabecera de una planificación (CU-E-09 y CU-E-10): `CreatePlanificationDto` y
// `EditPlanificationDto`, que tienen las mismas reglas. El nombre (hasta 50 caracteres), las rutinas por
// semana (`number_of_routines`, un entero de 1 en adelante: define los huecos de cada semana, no es un tope)
// y la duración (semanas, un entero de 1 en adelante: desde el 31/10 la web no crea ni guarda planes sin
// duración fija; el backend sigue aceptando 0) son obligatorios. La descripción (hasta 1000) y el tipo
// (hasta 30, texto libre) son opcionales y, vacíos, no se mandan: en la edición, omitirlos los borra.
// Los números son textos en el formulario (los inputs entregan texto) y el schema los convierte.

/** El tope de un entero de la base: lo que el contrato declara como máximo de la duración. */
export const PLAN_INT_MAX = 2_147_483_647;

/** Hasta cuántas semanas se arma un plan en pantalla. No es del contrato: es para que la grilla sea manejable. */
export const PLAN_WEEKS_MAX = 52;

/** Hasta cuántas rutinas por semana se arma en pantalla. No es del contrato: es para que la grilla sea manejable. */
export const PLAN_PER_WEEK_MAX = 10;

/** Cuántas rutinas admite una semana al crear el plan (`routine_ids` de `weeks`). */
export const PLAN_WEEK_ROUTINES_MAX = 50;

/** Con lo que arranca un alta, como el prototipo: 4 semanas y 3 rutinas por semana. */
const DEFAULT_WEEKS = '4';
const DEFAULT_PER_WEEK = '3';

/** Los tipos que el prototipo ofrece como atajo. El tipo es texto libre: se puede escribir otro. */
export const PLAN_TYPE_SUGGESTIONS = [
  'Fuerza',
  'Hipertrofia',
  'Resistencia',
] as const;

const INTEGER = /^\d+$/;

/** Un entero de `min` a `PLAN_INT_MAX` o un error en `path`. */
function checkInteger(
  context: RefinementCtx,
  path: 'duration' | 'number_of_routines',
  text: string,
  min: number,
  messages: { empty: string; range: string },
) {
  if (text === '') {
    context.addIssue({ code: 'custom', path: [path], message: messages.empty });
    return;
  }
  const value = Number(text);
  if (!INTEGER.test(text) || value < min || value > PLAN_INT_MAX) {
    context.addIssue({ code: 'custom', path: [path], message: messages.range });
  }
}

export const planSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Poné un nombre a la planificación')
      .max(50, 'El nombre no puede tener más de 50 caracteres'),
    description: z
      .string()
      .trim()
      .max(1000, 'Las notas no pueden tener más de 1000 caracteres'),
    type: z
      .string()
      .trim()
      .max(30, 'El tipo no puede tener más de 30 caracteres'),
    duration: z.string().trim(),
    number_of_routines: z.string().trim(),
  })
  .superRefine((values, context) => {
    checkInteger(context, 'duration', values.duration, 1, {
      empty: 'Indicá la duración en semanas',
      range: 'Poné un número entero de semanas, de 1 en adelante',
    });
    checkInteger(context, 'number_of_routines', values.number_of_routines, 1, {
      empty: 'Indicá cuántas rutinas tiene cada semana',
      range: 'Poné un número entero de rutinas, de 1 en adelante',
    });
  })
  .transform(
    ({
      name,
      description,
      type,
      duration,
      number_of_routines,
    }): EditPlanificationBody => ({
      name,
      number_of_routines: Number(number_of_routines),
      duration: Number(duration),
      ...(description !== '' && { description }),
      ...(type !== '' && { type }),
    }),
  );

export type PlanInput = z.input<typeof planSchema>;
export type PlanValues = z.output<typeof planSchema>;

/**
 * Los valores iniciales del formulario: los de una planificación ya guardada o, sin ella, una en blanco
 * con lo que propone el prototipo (4 semanas, 3 rutinas por semana, tipo Fuerza). El backend manda `null`
 * en lo que no tiene, aunque el contrato lo declara opcional.
 */
export function planDefaultValues(plan?: PlanificationDetail): PlanInput {
  return {
    name: plan?.name ?? '',
    description: plan?.description ?? '',
    type: plan ? (plan.type ?? '') : PLAN_TYPE_SUGGESTIONS[0],
    duration: plan ? String(plan.duration) : DEFAULT_WEEKS,
    number_of_routines: plan
      ? String(plan.number_of_routines)
      : DEFAULT_PER_WEEK,
  };
}
