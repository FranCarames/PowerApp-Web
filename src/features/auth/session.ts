import type { User } from '@/api/types';

import { isRole } from './roles';

/** Lo que se guarda al ingresar: el JWT (que llega en el header Authorization) y el usuario. */
export interface Session {
  token: string;
  user: User;
}

const STORAGE_KEY = 'powerapp.session';

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const { token, user } = value as Record<string, unknown>;
  if (typeof token !== 'string') return false;
  if (typeof user !== 'object' || user === null) return false;
  const { id, first_name, last_name, role } = user as Record<string, unknown>;
  return (
    typeof id === 'string' &&
    typeof first_name === 'string' &&
    typeof last_name === 'string' &&
    isRole(role)
  );
}

// El storage puede faltar o fallar (modo privado, cuota, datos de sitio bloqueados): en ese caso la
// sesión vive solo en memoria y la app sigue andando.

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isSession(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ver el comentario de arriba.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ver el comentario de arriba.
  }
}
