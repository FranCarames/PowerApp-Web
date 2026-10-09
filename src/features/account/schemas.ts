import { z } from 'zod';

import { isHttpUrl } from '@/shared/lib/url';
import {
  emailField,
  firstNameField,
  lastNameField,
  phoneNumberField,
  phonePrefixField,
} from '@/shared/lib/userFields';

/**
 * `EditUserDto`. En el DTO todo es opcional y se guarda solo lo que viene; en el formulario son
 * obligatorios el nombre, el apellido, el email y el teléfono (igual que en el registro) y es
 * opcional la foto de perfil, que es una URL de hasta 150 caracteres.
 */
export const profileSchema = z.object({
  first_name: firstNameField,
  last_name: lastNameField,
  email: emailField,
  phone_prefix: phonePrefixField,
  phone_number: phoneNumberField,
  profile_picture: z
    .string()
    .trim()
    .max(150, 'El link no puede tener más de 150 caracteres')
    .refine(
      (value) => value === '' || isHttpUrl(value),
      'Ingresá un link válido, que empiece con http:// o https://',
    ),
});

export type ProfileValues = z.input<typeof profileSchema>;
