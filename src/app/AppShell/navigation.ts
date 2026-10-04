import type { Role } from '@/api/types';
import type { IconName } from '@/shared/icons';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Otras rutas que pertenecen a esta entrada: con ellas abiertas, la entrada sigue marcada. */
  also?: string[];
}

const ACCOUNT: NavItem = { to: '/cuenta', label: 'Perfil', icon: 'user' };

/** Entradas de la tab bar (mobile) y de la barra lateral (desktop), por rol. */
export const NAV: Record<Role, NavItem[]> = {
  user: [
    {
      to: '/u/plan',
      label: 'Rutina',
      icon: 'dumbbell',
      also: ['/u/rutina', '/u/ejercicio', '/u/wiki'],
    },
    { to: '/u/rms', label: 'RMs', icon: 'trophy', also: ['/u/calculadora'] },
    { to: '/u/timer', label: 'Timer', icon: 'timer' },
    ACCOUNT,
  ],
  coach: [
    {
      to: '/c/alumnos',
      label: 'Alumnos',
      icon: 'users',
      also: ['/c/membresias', '/c/pago'],
    },
    { to: '/c/planes', label: 'Planes', icon: 'calendar' },
    {
      to: '/c/rutinas',
      label: 'Rutinas',
      icon: 'list',
      also: ['/c/circuitos'],
    },
    ACCOUNT,
  ],
  admin: [
    { to: '/a/inicio', label: 'Inicio', icon: 'home', also: ['/a/membresias'] },
    {
      to: '/a/catalogo',
      label: 'Catálogo',
      icon: 'grid',
      also: ['/a/ejercicios', '/a/musculos', '/a/grupos'],
    },
    {
      to: '/a/entrenadores',
      label: 'Coaches',
      icon: 'shield',
      also: ['/a/convertir'],
    },
    ACCOUNT,
  ],
};

/**
 * Entradas que solo muestra la barra lateral, bajo "Organización". En mobile se llega a Membresías
 * desde el botón de la barra superior de Mis alumnos, y la tab Alumnos queda marcada.
 */
export const ORGANIZATION_NAV: Record<Role, NavItem[]> = {
  user: [],
  coach: [
    {
      to: '/c/membresias',
      label: 'Membresías',
      icon: 'wallet',
      also: ['/c/pago'],
    },
  ],
  admin: [],
};

/** Una entrada está activa en su ruta y en todo lo que cuelga de ella (/c/alumnos/12), pero no en /c/alumnos-x. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return [item.to, ...(item.also ?? [])].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
