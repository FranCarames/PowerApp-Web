import type { Role } from '@/api/types';
import type { IconName } from '@/shared/icons';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Otras rutas que pertenecen a esta entrada: con ellas abiertas, la entrada sigue marcada. */
  also?: string[];
  /** Solo en la tab bar: la entrada queda marcada en cualquier pantalla que no pertenezca a otra (el "Más" del Admin). */
  fallback?: boolean;
}

/** Un bloque de la barra lateral, con su título si lo tiene. */
export interface NavGroup {
  title?: string;
  items: NavItem[];
}

const ACCOUNT: NavItem = { to: '/cuenta', label: 'Perfil', icon: 'user' };

const USER_TABS: NavItem[] = [
  {
    to: '/u/plan',
    label: 'Rutina',
    icon: 'dumbbell',
    also: ['/u/rutina', '/u/ejercicio', '/u/wiki'],
  },
  { to: '/u/rms', label: 'RMs', icon: 'trophy', also: ['/u/calculadora'] },
  { to: '/u/timer', label: 'Timer', icon: 'timer' },
  ACCOUNT,
];

const STUDENTS: NavItem = { to: '/c/alumnos', label: 'Alumnos', icon: 'users' };
const COACH_MEMBERSHIPS: NavItem = {
  to: '/c/membresias',
  label: 'Membresías',
  icon: 'wallet',
  also: ['/c/pago'],
};
const COACH_PLANS: NavItem = {
  to: '/c/planes',
  label: 'Planes',
  icon: 'calendar',
};
const COACH_ROUTINES: NavItem = {
  to: '/c/rutinas',
  label: 'Rutinas',
  icon: 'list',
  also: ['/c/circuitos'],
};

const HOME: NavItem = { to: '/a/inicio', label: 'Inicio', icon: 'home' };
const USERS: NavItem = { to: '/a/usuarios', label: 'Usuarios', icon: 'users' };
const COACHES: NavItem = {
  to: '/a/entrenadores',
  label: 'Entrenadores',
  icon: 'shield',
  also: ['/a/convertir'],
};
const EXERCISES: NavItem = {
  to: '/a/ejercicios',
  label: 'Ejercicios',
  icon: 'dumbbell',
};
const CIRCUITS: NavItem = {
  to: '/a/circuitos',
  label: 'Circuitos',
  icon: 'cycle',
};
const ROUTINES: NavItem = { to: '/a/rutinas', label: 'Rutinas', icon: 'list' };
const PLANS: NavItem = {
  to: '/a/planes',
  label: 'Planificaciones',
  icon: 'calendar',
};
const CATALOG: NavItem = { to: '/a/catalogo', label: 'Catálogo', icon: 'grid' };
const ADMIN_MEMBERSHIPS: NavItem = {
  to: '/a/membresias',
  label: 'Membresías',
  icon: 'wallet',
};
const MORE: NavItem = {
  to: '/a/mas',
  label: 'Más',
  icon: 'grid',
  fallback: true,
};

/** Entradas de la tab bar (mobile), por rol. */
export const TAB_BAR: Record<Role, NavItem[]> = {
  user: USER_TABS,
  coach: [
    // Membresías se abre desde el botón de la barra superior de Mis alumnos: su tab queda marcada.
    { ...STUDENTS, also: ['/c/membresias', '/c/pago'] },
    COACH_PLANS,
    COACH_ROUTINES,
    ACCOUNT,
  ],
  // Lo que no entra en la tab bar está en "Más".
  admin: [HOME, USERS, EXERCISES, ROUTINES, MORE],
};

/** Bloques de la barra lateral (desktop, desde 960 px), por rol. */
export const SIDEBAR: Record<Role, NavGroup[]> = {
  user: [{ items: USER_TABS }],
  coach: [
    { items: [STUDENTS, COACH_PLANS, COACH_ROUTINES, ACCOUNT] },
    { title: 'Organización', items: [COACH_MEMBERSHIPS] },
  ],
  admin: [
    { items: [HOME, USERS, COACHES] },
    { title: 'Entrenamiento', items: [EXERCISES, CIRCUITS, ROUTINES, PLANS] },
    { title: 'Configuración', items: [CATALOG, ADMIN_MEMBERSHIPS, ACCOUNT] },
  ],
};

/** Una entrada está activa en su ruta y en todo lo que cuelga de ella (/c/alumnos/12), pero no en /c/alumnos-x. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return [item.to, ...(item.also ?? [])].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * La entrada marcada de la tab bar: la primera a la que pertenece la ruta o, si ninguna, la de
 * `fallback`. Es la única marcada: así "Más" no se suma a otra.
 */
export function activeTabOf(
  items: NavItem[],
  pathname: string,
): NavItem | undefined {
  return (
    items.find((item) => !item.fallback && isNavItemActive(item, pathname)) ??
    items.find((item) => item.fallback)
  );
}
