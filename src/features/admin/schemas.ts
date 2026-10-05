import { z } from 'zod';

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Un texto opcional: vacío o hasta `max` caracteres. */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} no pueden tener más de ${max} caracteres`);
}

/** Un link opcional de hasta 150 caracteres (el largo de la columna del backend). */
const optionalUrl = z
  .string()
  .trim()
  .max(150, 'El link no puede tener más de 150 caracteres')
  .refine(
    (value) => value === '' || isHttpUrl(value),
    'Ingresá un link válido, que empiece con http:// o https://',
  );

/** Los campos opcionales del ejercicio: el backend no deja vaciarlos una vez cargados. */
const OPTIONAL_EXERCISE_FIELDS = [
  'safety_tips',
  'activation_tips',
  'video_url',
  'preview_image',
  'bg_image',
] as const;

type OptionalExerciseField = (typeof OPTIONAL_EXERCISE_FIELDS)[number];

const exerciseBase = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Poné un nombre al ejercicio')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  description: z
    .string()
    .trim()
    .min(1, 'Contá cómo se ejecuta el ejercicio')
    .max(2000, 'La descripción no puede tener más de 2000 caracteres'),
  // Los ids de los músculos (`exercised_muscles_ids`): el DTO exige al menos uno y sin repetidos.
  exercised_muscles_ids: z
    .array(z.string())
    .min(1, 'Elegí al menos un músculo'),
  safety_tips: optionalText(500, 'Los tips de seguridad'),
  activation_tips: optionalText(500, 'Los tips de activación'),
  video_url: optionalUrl,
  preview_image: optionalUrl,
  bg_image: optionalUrl,
});

/**
 * `CreateExerciseDto` y `EditExerciseDto`, que tienen las mismas reglas. En el DTO son obligatorios el
 * nombre y los músculos; la descripción es opcional, pero la columna no admite vacío, así que acá se
 * pide.
 *
 * Los campos opcionales no se pueden vaciar una vez cargados: el DTO rechaza el texto vacío y, si el
 * campo no viene, el backend conserva el valor anterior. `saved` son los valores ya guardados del
 * ejercicio que se edita: dejar uno vacío da un error en lugar de parecer que se borró.
 */
export function exerciseSchema(
  saved: Partial<Record<OptionalExerciseField, string>> = {},
) {
  return exerciseBase.superRefine((values, context) => {
    for (const field of OPTIONAL_EXERCISE_FIELDS) {
      if (saved[field] && values[field] === '') {
        context.addIssue({
          code: 'custom',
          path: [field],
          message:
            'El servidor no permite dejar vacío un dato ya cargado: cambialo por otro.',
        });
      }
    }
  });
}

export type ExerciseValues = z.input<typeof exerciseBase>;
