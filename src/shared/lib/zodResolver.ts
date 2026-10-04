import {
  get,
  set,
  type FieldErrors,
  type FieldValues,
  type Resolver,
} from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * Conecta un schema de Zod con React Hook Form: valida los valores del formulario con el schema y
 * le devuelve a cada campo su mensaje. Es el puente que da `@hookform/resolvers`, que no está en el
 * stack del proyecto; con campos anidados o en listas (`items.0.name`) arma los errores con la misma
 * forma que los valores.
 *
 * @example
 * const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
 */
export function zodResolver<TInput extends FieldValues, TOutput = TInput>(
  schema: ZodType<TOutput, TInput>,
): Resolver<TInput, unknown, TOutput> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: FieldErrors<TInput> = {};
    for (const issue of result.error.issues) {
      const name = issue.path.map(String).join('.');
      // Un campo muestra un solo mensaje: el del primer problema que encontró el schema.
      if (!get(errors, name)) {
        set(errors, name, { type: issue.code, message: issue.message });
      }
    }
    return { values: {}, errors };
  };
}
