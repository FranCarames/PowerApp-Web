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

/**
 * `CreateMuscleDto` y `EditMuscleDto`, que tienen las mismas reglas: el grupo y el nombre (hasta 50
 * caracteres) son obligatorios; la descripción y los dos links (hasta 150 caracteres, el largo de la
 * columna) son opcionales.
 */
export const muscleSchema = z.object({
  muscle_group_id: z.string().min(1, 'Elegí un grupo muscular'),
  name: z
    .string()
    .trim()
    .min(1, 'Poné un nombre al músculo')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  description: z.string().trim(),
  image_url: optionalUrl,
  preview_image: optionalUrl,
});

export type MuscleValues = z.input<typeof muscleSchema>;

/**
 * `CreateMuscleGroupDto` y `EditMuscleGroupDto`, que tienen las mismas reglas: el nombre (hasta 50
 * caracteres) es obligatorio y los dos links (hasta 150 caracteres) son opcionales.
 */
export const muscleGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Poné un nombre al grupo')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  image_url: optionalUrl,
  preview_image: optionalUrl,
});

export type MuscleGroupValues = z.input<typeof muscleGroupSchema>;

/**
 * Los datos profesionales de un entrenador: `PromoteCoachDto` (CU-A-17, junto con el id del alumno) y,
 * con las mismas reglas, su edición (CU-A-18, T37). El email llega a 50 caracteres y el backend lo pasa a
 * minúsculas. El CUIL se envía con 11 dígitos y sin guiones, aunque se escriba con la máscara
 * "27-12345678-4".
 */
export const coachDataSchema = z.object({
  coach_email: z
    .string()
    .trim()
    .min(1, 'Ingresá el email profesional')
    .max(50, 'El email no puede tener más de 50 caracteres')
    .pipe(z.email('Ingresá un email válido'))
    .transform((value) => value.toLowerCase()),
  cuil: z
    .string()
    .trim()
    .min(1, 'Ingresá el CUIL')
    .refine(
      (value) =>
        /^[\d\s-]+$/.test(value) && value.replace(/\D/g, '').length === 11,
      'El CUIL tiene 11 dígitos',
    )
    .transform((value) => value.replace(/\D/g, '')),
});

export type CoachDataInput = z.input<typeof coachDataSchema>;
export type CoachDataValues = z.output<typeof coachDataSchema>;

/** El precio más alto que entra en la columna del backend: `decimal(10, 2)`. */
const MAX_PRICE = 99_999_999.99;

/**
 * `CreateMembershipDto` y `EditMembershipDto`, que tienen las mismas reglas. El nombre llega a 50
 * caracteres; la duración es un entero de días, de 1 en adelante; el precio es mayor a cero y con
 * hasta dos decimales. En el formulario son textos (los campos numéricos entregan texto) y el schema
 * los convierte a número.
 */
export const membershipTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Poné un nombre a la membresía')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  price: z
    .string()
    .trim()
    .min(1, 'Ingresá el precio')
    .refine(
      (value) =>
        /^\d+([.,]\d{1,2})?$/.test(value) &&
        Number(value.replace(',', '.')) >= 0.01,
      'El precio tiene que ser mayor a cero, con hasta dos decimales',
    )
    .transform((value) => Number(value.replace(',', '.')))
    .refine((value) => value <= MAX_PRICE, 'El precio es demasiado alto'),
  duration: z
    .string()
    .trim()
    .min(1, 'Ingresá la duración en días')
    .refine(
      (value) => /^\d+$/.test(value) && Number(value) >= 1,
      'La duración es un número entero de días, de 1 en adelante',
    )
    .transform(Number),
});

export type MembershipTypeInput = z.input<typeof membershipTypeSchema>;
export type MembershipTypeValues = z.output<typeof membershipTypeSchema>;
