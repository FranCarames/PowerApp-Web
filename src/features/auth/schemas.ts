import { z } from 'zod';

// Un schema por formulario, con las reglas del DTO que le corresponde en el contrato (openapi.json).

// El email llega a 50 caracteres en `LoginUserDto` y en `CreateUserDto`. Se recorta; el backend lo
// pasa a minúsculas.
const email = z
  .string()
  .trim()
  .min(1, 'Ingresá tu email')
  .max(50, 'El email no puede tener más de 50 caracteres')
  .pipe(z.email('Ingresá un email válido'));

// La contraseña tiene entre 6 y 50 caracteres. No se recorta: los espacios pueden ser parte de ella.
function password(emptyMessage: string) {
  return z
    .string()
    .min(1, emptyMessage)
    .min(6, 'La contraseña tiene al menos 6 caracteres')
    .max(50, 'La contraseña no puede tener más de 50 caracteres');
}

/** `LoginUserDto`. */
export const loginSchema = z.object({
  email,
  password: password('Ingresá tu contraseña'),
});

export type LoginValues = z.input<typeof loginSchema>;

/** `RecoverPasswordDto`: solo el email. */
export const recoverSchema = z.object({ email });

export type RecoverValues = z.input<typeof recoverSchema>;

/**
 * `CreateUserDto`, menos `role`: el registro siempre manda `user` y no es un campo del formulario.
 * Todos son obligatorios y tienen un largo máximo (nombre y apellido, 50; prefijo, 10; teléfono, 20).
 */
export const registerSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, 'Ingresá tu nombre')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  last_name: z
    .string()
    .trim()
    .min(1, 'Ingresá tu apellido')
    .max(50, 'El apellido no puede tener más de 50 caracteres'),
  email,
  phone_prefix: z
    .string()
    .trim()
    .min(1, 'Ingresá el código de país')
    .max(10, 'El código de país no puede tener más de 10 caracteres'),
  phone_number: z
    .string()
    .trim()
    .min(1, 'Ingresá tu teléfono')
    .max(20, 'El teléfono no puede tener más de 20 caracteres'),
  password: password('Ingresá una contraseña'),
});

export type RegisterValues = z.input<typeof registerSchema>;
