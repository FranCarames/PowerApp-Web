import type { Role } from '@/api/types';

/** Pantalla de inicio de cada rol, a la que se va al ingresar. */
export const HOME_BY_ROLE: Record<Role, string> = {
  user: '/u/plan',
  coach: '/c/alumnos',
  admin: '/a/inicio',
};

/** Cómo se nombra cada rol en la interfaz. */
export const ROLE_LABEL: Record<Role, string> = {
  user: 'Alumno',
  coach: 'Entrenador',
  admin: 'Admin',
};

/** El color del avatar de cada rol: el del alumno es el de marca, el del entrenador el violeta. */
export const ROLE_AVATAR_TONE = {
  user: 'pri',
  coach: 'acc',
  admin: 'gray',
} as const satisfies Record<Role, string>;

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && Object.hasOwn(HOME_BY_ROLE, value);
}
