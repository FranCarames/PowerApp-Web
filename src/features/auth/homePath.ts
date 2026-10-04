import type { Session } from './session';
import { HOME_BY_ROLE } from './roles';

/** La pantalla del cambio de contraseña, obligatorio tras entrar con una contraseña temporal. */
export const PASSWORD_CHANGE_PATH = '/cambiar-contrasena';

/**
 * A dónde va una sesión al entrar o al pedir "/": al inicio de su rol, o al cambio de contraseña si
 * lo tiene pendiente (es la única pantalla que puede ver).
 */
export function homePathFor({
  user,
  passwordChangeRequired,
}: Pick<Session, 'user' | 'passwordChangeRequired'>): string {
  return passwordChangeRequired
    ? PASSWORD_CHANGE_PATH
    : HOME_BY_ROLE[user.role];
}
