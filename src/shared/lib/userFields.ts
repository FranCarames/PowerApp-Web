import { z } from 'zod';

// Las reglas de los campos de un usuario, que comparten los DTOs del contrato (`LoginUserDto`,
// `CreateUserDto`, `EditUserDto`…). Cada formulario arma su schema con estas piezas.

/** El email llega a 50 caracteres. Se recorta; el backend lo pasa a minúsculas. */
export const emailField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu email')
  .max(50, 'El email no puede tener más de 50 caracteres')
  .pipe(z.email('Ingresá un email válido'));

/** La contraseña tiene entre 6 y 50 caracteres. No se recorta: los espacios pueden ser parte de ella. */
export function passwordField(emptyMessage: string) {
  return z
    .string()
    .min(1, emptyMessage)
    .min(6, 'La contraseña tiene al menos 6 caracteres')
    .max(50, 'La contraseña no puede tener más de 50 caracteres');
}

export const firstNameField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu nombre')
  .max(50, 'El nombre no puede tener más de 50 caracteres');

export const lastNameField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu apellido')
  .max(50, 'El apellido no puede tener más de 50 caracteres');

/** El código de país ("+54") llega a 10 caracteres. */
export const phonePrefixField = z
  .string()
  .trim()
  .min(1, 'Ingresá el código de país')
  .max(10, 'El código de país no puede tener más de 10 caracteres');

/** El teléfono llega a 20 caracteres. Acepta cualquier texto, igual que el backend. */
export const phoneNumberField = z
  .string()
  .trim()
  .min(1, 'Ingresá tu teléfono')
  .max(20, 'El teléfono no puede tener más de 20 caracteres');
