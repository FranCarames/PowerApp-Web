import { passthrough } from 'msw';

import { demoAccountForToken } from './fixtures/users';
import { guardError } from './responses';

/**
 * El acceso a un endpoint de entrenador y admin que se mockea solo para las cuentas de demo. Devuelve
 * la respuesta con la que cortar el mock, o `null` si tiene que contestar:
 * - un token que no es de demo: `passthrough()`, para que lo atienda el backend de verdad;
 * - la cuenta de un alumno: el 403 que daría el guard;
 * - un entrenador o un admin de demo: `null`.
 *
 * @example
 * const denied = staffAccess(request);
 * if (denied) return denied;
 */
export function staffAccess(request: Request) {
  const account = demoAccountForToken(request.headers.get('Authorization'));
  if (!account) return passthrough();
  if (account.user.role === 'user') {
    return guardError(403, 'Acceso denegado. Permisos insuficientes.');
  }
  return null;
}

/** Sin `include_inactive`, el backend deja afuera lo dado de baja (circuitos, rutinas y planificaciones). */
export function withoutInactive<T extends { active: boolean }>(
  items: readonly T[],
  request: Request,
): T[] {
  const includeInactive =
    new URL(request.url).searchParams.get('include_inactive') === 'true';
  return includeInactive ? [...items] : items.filter((item) => item.active);
}
