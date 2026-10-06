import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { Coach, User } from '@/api/types';
import { fullName } from '@/shared/lib/fullName';

/** Lo máximo que acepta `limit` en `GET /users/all`. */
const MAX_PAGE_SIZE = 100;

/**
 * Las opciones de la query de `GET /coach/all`, para que todos la pidan igual y compartan el caché.
 * Es público: no lleva token. Trae los datos profesionales de **todos** los registros de Coach, también
 * de los dados de baja (`active: false`), y no trae nombre ni apellido (V3).
 */
export function coachesQuery() {
  return queryOptions({
    queryKey: queryKeys.coaches.list(),
    queryFn: ({ signal }) => api.get('/api/v1/coach/all', { signal }),
  });
}

/**
 * `GET /users/all?role=coach`, todas las páginas: de ahí sale el nombre de cada entrenador, que `Coach`
 * no tiene (V3). El usuario no trae el coach anidado, así que se cruza por id con `GET /coach/all`. Las
 * páginas se piden con offset: si un usuario se mueve entre una y otra, viene dos veces y se queda con una.
 */
function coachUsersQuery() {
  return queryOptions({
    queryKey: queryKeys.users.coaches(),
    queryFn: async ({ signal }) => {
      const users = new Map<string, User>();
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages) {
        const result = await api.get('/api/v1/users/all', {
          query: { role: 'coach', page, limit: MAX_PAGE_SIZE },
          signal,
        });
        for (const user of result.data) users.set(user.id, user);
        totalPages = result.totalPages;
        page += 1;
      }
      return [...users.values()];
    },
  });
}

/** Un entrenador del listado: su usuario (nombre y cuenta) y sus datos profesionales (email y CUIL). */
export interface CoachEntry {
  user: User;
  /**
   * Sus datos profesionales. Pueden faltar: el backend cambia el rol del usuario antes de guardar el
   * Coach, así que un alta que falla a la mitad deja a alguien con el rol y sin registro.
   */
  coach: Coach | undefined;
}

/**
 * Si el entrenador está activo: la cuenta no está dada de baja (`POST /users/set-active`, que no toca
 * `Coach.active`) y su registro de Coach tampoco. Eliminar un entrenador le quita el rol, así que no
 * sigue en el listado: un `Coach` inactivo con el rol puesto no debería existir.
 */
export function isCoachActive({ user, coach }: CoachEntry): boolean {
  return user.active && coach?.active !== false;
}

/** Primero los activos y, dentro de cada grupo, por nombre. El backend no ordena `GET /coach/all`. */
function byStateAndName(a: CoachEntry, b: CoachEntry) {
  return (
    Number(isCoachActive(b)) - Number(isCoachActive(a)) ||
    fullName(a.user).localeCompare(fullName(b.user), 'es')
  );
}

function joinCoaches(users: User[], records: Coach[]): CoachEntry[] {
  const recordById = new Map(records.map((record) => [record.id, record]));
  return users
    .map((user) => ({ user, coach: recordById.get(user.id) }))
    .sort(byStateAndName);
}

/**
 * Los entrenadores del Admin (CU-A-16): los usuarios con rol `coach` (el nombre) cruzados por id con
 * `GET /coach/all` (email profesional y CUIL). Son dos requests y hacen falta los dos; `retry` vuelve
 * a pedir solo el que falló. Mientras uno no llegó, `data` es `undefined`.
 */
export function useCoaches() {
  const users = useQuery(coachUsersQuery());
  const records = useQuery(coachesQuery());

  const failed = [users, records].filter((query) => query.isError);

  return {
    data:
      users.data && records.data
        ? joinCoaches(users.data, records.data)
        : undefined,
    isError: failed.length > 0,
    error: failed[0]?.error ?? null,
    retrying: failed.some((query) => query.isFetching),
    retry: () => failed.forEach((query) => void query.refetch()),
  };
}
