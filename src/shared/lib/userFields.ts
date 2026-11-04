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

// El teléfono (CU-U-01 y CU-U-06) son dos campos y su regla es la del backend (BE-43): el código de
// país es "+" y de 1 a 4 dígitos, y el número es solo dígitos. Cada campo da UN mensaje: el del primer
// control que falla, en este orden. El tope de largo va antes que el formato, así que quien se pasa
// de largo ve siempre el mismo mensaje. El backend valida lo mismo, pero es la red de seguridad: la
// web avisa antes de mandar el pedido.

/**
 * El código de país: "+" y de 1 a 4 dígitos ("+54", "+1", "+598"), hasta 10 caracteres. No acepta
 * espacios ni guiones adentro ("+ 54" da error); solo se recortan los de los extremos.
 * Orden de los mensajes: vacío, de más de 10 caracteres, formato.
 */
export const phonePrefixField = z
  .string()
  .trim()
  .min(1, 'Ingresá el código de país')
  .max(10, 'El código de país no puede tener más de 10 caracteres')
  .regex(
    /^\+\d{1,4}$/,
    'Ingresá el código de país con + y números, por ejemplo +54',
  );

/** Los espacios y guiones que se aceptan al escribir el número y se sacan antes de validar y de mandar. */
const PHONE_NUMBER_SEPARATORS = /[\s-]/g;

/**
 * El número: solo dígitos, hasta 20. Acepta espacios y guiones al escribir ("11 2345-6789"), que se
 * sacan antes de validar y de mandar: el schema devuelve solo los dígitos ("1123456789") y el largo
 * cuenta solo esos. Es lo único que se limpia: cualquier otro carácter ("abc", "(11)", "+54…") da su
 * error en vez de descartarse. Orden de los mensajes: vacío, de más de 20 caracteres, formato.
 */
export const phoneNumberField = z
  .string()
  .transform((value) => value.replace(PHONE_NUMBER_SEPARATORS, ''))
  .pipe(
    z
      .string()
      .min(1, 'Ingresá tu teléfono')
      .max(20, 'El teléfono no puede tener más de 20 caracteres')
      .regex(/^\d+$/, 'El teléfono solo puede tener números'),
  );
