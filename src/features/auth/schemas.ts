import { z } from 'zod';

import {
  emailField,
  firstNameField,
  lastNameField,
  passwordField,
  phoneNumberField,
  phonePrefixField,
} from '@/shared/lib/userFields';

// Un schema por formulario, con las reglas del DTO que le corresponde en el contrato (openapi.json).
// Las reglas de cada campo están en `shared/lib/userFields.ts`, porque las comparten varios DTOs.

/** `LoginUserDto`. */
export const loginSchema = z.object({
  email: emailField,
  password: passwordField('Ingresá tu contraseña'),
});

export type LoginValues = z.input<typeof loginSchema>;

/**
 * `ChangePasswordDto` más "repetir contraseña", que es solo del formulario: el body lleva
 * `current_password` y `new_password`. La actual puede ser la temporal (cuando se entró con ella), y
 * el DTO le pide solo el largo máximo; la nueva, entre 6 y 50.
 */
export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, 'Ingresá tu contraseña actual')
      .max(50, 'La contraseña no puede tener más de 50 caracteres'),
    new_password: passwordField('Ingresá una contraseña nueva'),
    confirm_password: z.string().min(1, 'Repetí la contraseña nueva'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Las contraseñas no coinciden',
  });

export type ChangePasswordValues = z.input<typeof changePasswordSchema>;

/** `RecoverPasswordDto`: solo el email. */
export const recoverSchema = z.object({ email: emailField });

export type RecoverValues = z.input<typeof recoverSchema>;

/**
 * `CreateUserDto`, menos `role`: el registro siempre manda `user` y no es un campo del formulario.
 * Todos son obligatorios y tienen un largo máximo (nombre y apellido, 50; prefijo, 10; teléfono, 20).
 */
export const registerSchema = z.object({
  first_name: firstNameField,
  last_name: lastNameField,
  email: emailField,
  phone_prefix: phonePrefixField,
  phone_number: phoneNumberField,
  password: passwordField('Ingresá una contraseña'),
});

export type RegisterValues = z.input<typeof registerSchema>;
