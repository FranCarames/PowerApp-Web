import { z } from 'zod';

// Un schema por formulario, con las reglas del DTO que le corresponde en el contrato (openapi.json).

/** `LoginUserDto`: el email llega a 50 caracteres y la contraseña tiene entre 6 y 50. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu email')
    .max(50, 'El email no puede tener más de 50 caracteres')
    .pipe(z.email('Ingresá un email válido')),
  // La contraseña no se recorta: los espacios pueden ser parte de ella.
  password: z
    .string()
    .min(1, 'Ingresá tu contraseña')
    .min(6, 'La contraseña tiene al menos 6 caracteres')
    .max(50, 'La contraseña no puede tener más de 50 caracteres'),
});

export type LoginValues = z.input<typeof loginSchema>;
