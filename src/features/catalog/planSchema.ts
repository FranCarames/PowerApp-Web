import { z, type RefinementCtx } from 'zod';

import type { EditPlanificationBody, PlanificationDetail } from '@/api/types';

// El formulario de la cabecera de una planificación (CU-E-09 y CU-E-10): `CreatePlanificationDto` y
// `EditPlanificationDto`, que tienen las mismas reglas. El nombre (hasta 50 caracteres), el número de rutinas
// (un entero de 1 en adelante: la meta que declara el entrenador, no lo asignado) y la duración (semanas,
// un entero de 0 en adelante; 0 es sin duración fija) son obligatorios. La descripción (hasta 1000) y el
// tipo (hasta 30, texto libre) son opcionales y, vacíos, no se mandan: en la edición, omitirlos los borra.
// Los números son textos en el formulario (los inputs entregan texto) y el schema los convierte.

/** El tope de un entero de la base: lo que el contrato declara como máximo de la duración. */
export const PLAN_INT_MAX = 2_147_483_647;

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
    checkInteger(context, 'duration', values.duration, 0, {
      empty: 'Indicá la duración en semanas (0 si no tiene duración fija)',
      range: 'Poné un número entero de semanas, de 0 en adelante',
    });
    checkInteger(context, 'number_of_routines', values.number_of_routines, 1, {
      empty: 'Indicá cuántas rutinas va a tener el plan',
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
 * con lo que propone el prototipo (8 semanas, tipo Fuerza). El backend manda `null` en lo que no tiene,
 * aunque el contrato lo declara opcional.
 */
export function planDefaultValues(plan?: PlanificationDetail): PlanInput {
  return {
    name: plan?.name ?? '',
    description: plan?.description ?? '',
    type: plan ? (plan.type ?? '') : PLAN_TYPE_SUGGESTIONS[0],
    duration: plan ? String(plan.duration) : '8',
    number_of_routines: plan ? String(plan.number_of_routines) : '',
  };
}
