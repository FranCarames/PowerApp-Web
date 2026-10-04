import { queryClient } from '@/api/queryClient';
import type { User } from '@/api/types';

import {
  clearSession,
  readSession,
  writeSession,
  type Session,
} from './session';

// La sesión vive acá, fuera de React, para que el cliente de la API pueda cerrarla ante un 401 o un
// 403 sin pasar por un componente. <AuthProvider> se suscribe y la expone con `useAuth()`.
// localStorage se lee una sola vez, al cargar la página; después manda la memoria de cada pestaña.

let current: Session | null = readSession();
const changeListeners = new Set<() => void>();
const endListeners = new Set<(notice: string) => void>();

function notifyChange(): void {
  changeListeners.forEach((listener) => listener());
}

/** La sesión actual, o `null`. Es el mismo objeto hasta que la sesión cambia. */
export function getSession(): Session | null {
  return current;
}

/** Para `useSyncExternalStore`: avisa cuando cambia la sesión. Devuelve cómo dejar de escuchar. */
export function subscribeSession(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

/**
 * Para avisarle algo al usuario cuando la sesión se cierra sin que lo haya pedido (sesión vencida,
 * cuenta deshabilitada). Devuelve cómo dejar de escuchar.
 */
export function onSessionEnded(listener: (notice: string) => void): () => void {
  endListeners.add(listener);
  return () => endListeners.delete(listener);
}

/** Abre una sesión nueva. Vacía el caché de TanStack Query: los datos de una sesión no son de la siguiente. */
export function startSession(next: Session): void {
  writeSession(next);
  queryClient.clear();
  current = next;
  notifyChange();
}

/**
 * Cierra la sesión. Con `notice` (el texto para el usuario) quiere decir que se cerró sola. Si no
 * hay sesión no hace nada, así que varios 401 seguidos la cierran una sola vez.
 */
export function endSession(notice?: string): void {
  if (!current) return;
  clearSession();
  queryClient.clear();
  current = null;
  notifyChange();
  if (notice) endListeners.forEach((listener) => listener(notice));
}

/**
 * Cambia el usuario de la sesión (después de editar sus datos personales). El token y el cambio de
 * contraseña pendiente siguen igual, y el caché no se vacía: es la misma sesión.
 */
export function updateSessionUser(user: User): void {
  if (!current) return;
  current = { ...current, user };
  writeSession(current);
  notifyChange();
}

/** Termina el cambio obligatorio de contraseña: la sesión sigue, pero se libera el guard. */
export function completePasswordChange(): void {
  if (!current?.passwordChangeRequired) return;
  current = { token: current.token, user: current.user };
  writeSession(current);
  notifyChange();
}
