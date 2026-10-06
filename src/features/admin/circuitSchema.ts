import { z, type RefinementCtx } from 'zod';

import type { CircuitDetail } from '@/api/pending';
import type { CreateCircuitBody, CreateCircuitSetBody } from '@/api/types';

// El formulario de un circuito (CU-E-22 y CU-E-23): `CreateCircuitDto` y `EditCircuitDto`, que tienen las
// mismas reglas. Los campos numéricos son textos en el formulario (los inputs entregan texto) y el schema
// los convierte; los opcionales vacíos no se mandan, porque el DTO rechaza el texto vacío.

/** Qué escala de intensidad lleva un bloque: RPE y RIR son la misma escala invertida y no se mezclan. */
export const EFFORTS = ['none', 'rpe', 'rir'] as const;
export type Effort = (typeof EFFORTS)[number];

const INTEGER = /^\d+$/;
const DECIMAL = /^\d+([.,]\d{1,2})?$/;

function toInteger(text: string): number | null {
  return INTEGER.test(text) ? Number(text) : null;
}

/** Un entero de `min` a `max` o un error en `path`. Un texto vacío no es un error: lo decide quien llama. */
function checkInteger(
  context: RefinementCtx,
  path: string,
  text: string,
  [min, max]: [number, number],
  messages: { empty?: string; range: string },
): number | null {
  if (text === '') {
    if (messages.empty) {
      context.addIssue({
        code: 'custom',
        path: [path],
        message: messages.empty,
      });
    }
    return null;
  }
  const value = toInteger(text);
  if (value === null || value < min || value > max) {
    context.addIssue({ code: 'custom', path: [path], message: messages.range });
    return null;
  }
  return value;
}

/**
 * Un bloque de series: una fila es un bloque de series iguales (`set_count: 3` con `rep_count: 8` es
 * "3×8"). Las reglas de los DTOs: series de 1 a 20, repeticiones de 1 a 1000, peso de 0,01 a 1000 con hasta
 * dos decimales, RPE de 1 a 10 o RIR de 0 a 10 (uno u otro), % del RM de 1 a 125, el tiempo del AMRAP solo
 * con AMRAP, y un intento de RM exige una sola serie.
 */
const setBlockSchema = z
  .object({
    set_count: z.string().trim(),
    rep_count: z.string().trim(),
    weight: z.string().trim(),
    effort: z.enum(EFFORTS),
    effort_value: z.string().trim(),
    rm_perc: z.string().trim(),
    amrap: z.boolean(),
    amrap_time: z.string().trim(),
    rm: z.boolean(),
  })
  .superRefine((values, context) => {
    const setCount = checkInteger(
      context,
      'set_count',
      values.set_count,
      [1, 20],
      {
        empty: 'Ingresá las series',
        range: 'De 1 a 20 series',
      },
    );
    checkInteger(context, 'rep_count', values.rep_count, [1, 1000], {
      empty: 'Ingresá las repeticiones',
      range: 'De 1 a 1000 repeticiones',
    });

    if (values.weight !== '') {
      const weight = Number(values.weight.replace(',', '.'));
      if (!DECIMAL.test(values.weight) || weight < 0.01 || weight > 1000) {
        context.addIssue({
          code: 'custom',
          path: ['weight'],
          message: 'De 0,01 a 1000 kg, con hasta dos decimales',
        });
      }
    }

    if (values.effort === 'rpe') {
      checkInteger(context, 'effort_value', values.effort_value, [1, 10], {
        empty: 'Ingresá el RPE',
        range: 'El RPE va de 1 a 10',
      });
    } else if (values.effort === 'rir') {
      checkInteger(context, 'effort_value', values.effort_value, [0, 10], {
        empty: 'Ingresá el RIR',
        range: 'El RIR va de 0 a 10',
      });
    }

    checkInteger(context, 'rm_perc', values.rm_perc, [1, 125], {
      range: 'El % del RM va de 1 a 125',
    });

    if (values.amrap) {
      checkInteger(context, 'amrap_time', values.amrap_time, [1, 86_400], {
        range: 'Segundos, de 1 en adelante',
      });
    }

    // Un test de máximo es un intento: dos intentos son dos bloques iguales.
    if (values.rm && setCount !== null && setCount !== 1) {
      context.addIssue({
        code: 'custom',
        path: ['rm'],
        message: 'Un intento de RM es de una sola serie: poné Series en 1',
      });
    }
  })
  .transform((values): CreateCircuitSetBody => {
    const weight =
      values.weight === '' ? null : Number(values.weight.replace(',', '.'));
    return {
      set_count: Number(values.set_count),
      rep_count: Number(values.rep_count),
      ...(weight !== null && { weight }),
      ...(values.effort === 'rpe' && { rpe: Number(values.effort_value) }),
      ...(values.effort === 'rir' && { rir: Number(values.effort_value) }),
      ...(values.rm_perc !== '' && { rm_perc: Number(values.rm_perc) }),
      amrap: values.amrap,
      ...(values.amrap &&
        values.amrap_time !== '' && { amrap_time: Number(values.amrap_time) }),
      rm: values.rm,
    };
  });

const circuitExerciseSchema = z
  .object({
    exercise_id: z.string().min(1),
    // El nombre es solo para mostrarlo: no viaja.
    name: z.string(),
    coach_note: z
      .string()
      .trim()
      .max(100, 'La nota no puede tener más de 100 caracteres'),
    sets: z
      .array(setBlockSchema)
      .min(1, 'Cada ejercicio necesita al menos un bloque de series'),
  })
  .transform(({ exercise_id, coach_note, sets }) => ({
    exercise_id,
    ...(coach_note !== '' && { coach_note }),
    sets,
  }));

/**
 * `CreateCircuitDto` y `EditCircuitDto`: el nombre (hasta 100 caracteres) y el tipo (hasta 30, texto libre)
 * son obligatorios; la descripción (hasta 100) es opcional. Lleva al menos un ejercicio, sin repetir
 * ninguno: si hace falta el mismo movimiento dos veces, se usa una variación del catálogo.
 */
export const circuitSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Poné un nombre al circuito')
      .max(100, 'El nombre no puede tener más de 100 caracteres'),
    type: z
      .string()
      .trim()
      .min(1, 'Poné el tipo del circuito')
      .max(30, 'El tipo no puede tener más de 30 caracteres'),
    description: z
      .string()
      .trim()
      .max(100, 'La descripción no puede tener más de 100 caracteres'),
    exercises: z
      .array(circuitExerciseSchema)
      .min(1, 'Agregá al menos un ejercicio'),
  })
  .superRefine((values, context) => {
    const seen = new Set<string>();
    for (const [index, { exercise_id }] of values.exercises.entries()) {
      if (seen.has(exercise_id)) {
        context.addIssue({
          code: 'custom',
          path: ['exercises', index],
          message: 'Un ejercicio no puede repetirse dentro del circuito',
        });
      }
      seen.add(exercise_id);
    }
  })
  .transform(({ name, type, description, exercises }): CreateCircuitBody => ({
    name,
    type,
    ...(description !== '' && { description }),
    exercises,
  }));

export type CircuitInput = z.input<typeof circuitSchema>;
export type CircuitValues = z.output<typeof circuitSchema>;
export type SetBlockInput = z.input<typeof setBlockSchema>;
export type CircuitExerciseInput = CircuitInput['exercises'][number];

/** Un bloque de series nuevo, el que se ofrece al agregar un ejercicio o un bloque: 3×8. */
export function emptySetBlock(): SetBlockInput {
  return {
    set_count: '3',
    rep_count: '8',
    weight: '',
    effort: 'none',
    effort_value: '',
    rm_perc: '',
    amrap: false,
    amrap_time: '',
    rm: false,
  };
}

/** Un ejercicio del catálogo recién agregado al circuito, con un bloque de series. */
export function newCircuitExercise(
  exerciseId: string,
  name: string,
): CircuitExerciseInput {
  return {
    exercise_id: exerciseId,
    name,
    coach_note: '',
    sets: [emptySetBlock()],
  };
}

/** Un número del backend como texto del formulario, con coma decimal. Falta o `null`: vacío. */
function text(value: number | null | undefined): string {
  return value === null || value === undefined
    ? ''
    : String(value).replace('.', ',');
}

/**
 * Los valores iniciales del formulario: los de un circuito ya guardado o, sin él, un circuito en blanco.
 * El backend manda `null` en lo que no tiene, aunque el contrato lo declara opcional.
 */
export function circuitDefaultValues(circuit?: CircuitDetail): CircuitInput {
  return {
    name: circuit?.name ?? '',
    type: circuit?.type ?? '',
    description: circuit?.description ?? '',
    exercises: (circuit?.exercises ?? []).map(
      ({ exercise, coach_note, sets }) => ({
        exercise_id: exercise.id,
        name: exercise.name,
        coach_note: coach_note ?? '',
        sets: sets.map((set): SetBlockInput => ({
          set_count: text(set.set_count),
          rep_count: text(set.rep_count),
          weight: text(set.weight),
          effort: set.rpe != null ? 'rpe' : set.rir != null ? 'rir' : 'none',
          effort_value: text(set.rpe ?? set.rir),
          rm_perc: text(set.rm_perc),
          amrap: set.amrap,
          amrap_time: text(set.amrap_time),
          rm: set.rm,
        })),
      }),
    ),
  };
}

/**
 * El circuito como body de un alta, para duplicarlo: la misma estructura con el nombre cambiado.
 * Las series se mandan como están guardadas (el contrato las trae como un bloque por fila).
 */
export function circuitCopyBody(
  circuit: CircuitDetail,
  name: string,
): CreateCircuitBody {
  return {
    name,
    type: circuit.type,
    ...(circuit.description ? { description: circuit.description } : {}),
    exercises: circuit.exercises.map(({ exercise, coach_note, sets }) => ({
      exercise_id: exercise.id,
      ...(coach_note ? { coach_note } : {}),
      sets: sets.map((set) => ({
        set_count: set.set_count,
        rep_count: set.rep_count,
        ...(set.weight != null && { weight: set.weight }),
        ...(set.rpe != null && { rpe: set.rpe }),
        ...(set.rir != null && { rir: set.rir }),
        ...(set.rm_perc != null && { rm_perc: set.rm_perc }),
        amrap: set.amrap,
        ...(set.amrap_time != null && { amrap_time: set.amrap_time }),
        rm: set.rm,
      })),
    })),
  };
}
