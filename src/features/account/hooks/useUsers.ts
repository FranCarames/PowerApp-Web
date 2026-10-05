import {
  keepPreviousData,
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PaginatedUsers, Role, User } from '@/api/types';

/** Cuántos usuarios trae cada página. Es el valor por defecto del backend. */
export const USERS_PAGE_SIZE = 20;

export interface UsersFilter {
  /** Solo los de ese rol. Sin definir: todos. */
  role?: Role;
  /** Texto a buscar en nombre, apellido y email. Vacío o sin definir: no filtra. */
  keyword?: string;
  /** Estado de la cuenta. Sin definir: todas. */
  active?: boolean;
}

/**
 * Los usuarios cargados hasta ahora, en un solo arreglo, y cuántos hay en total con ese filtro. Las
 * páginas se piden con offset: si un usuario cambia de lugar mientras se carga la página siguiente,
 * viene en las dos, y la fila se muestra una sola vez.
 */
function selectUsers({ pages }: InfiniteData<PaginatedUsers>) {
  const unique = new Map<string, User>();
  for (const page of pages) {
    for (const user of page.data) unique.set(user.id, user);
  }
  return { users: [...unique.values()], total: pages.at(-1)?.total ?? 0 };
}

/**
 * `GET /users/all`: los usuarios, de a páginas, con su filtro. Los alumnos son los de `role=user`
 * (no existe un vínculo entrenador-alumno). El backend los devuelve del más nuevo al más viejo y la
 * búsqueda es de coincidencia parcial. Mientras llega el resultado de una búsqueda nueva se sigue
 * mostrando el anterior (`isPlaceholderData`).
 */
export function useUsers({ role, keyword, active }: UsersFilter) {
  const filter = { role, keyword: keyword || undefined, active };

  return useInfiniteQuery({
    queryKey: queryKeys.users.list(filter),
    queryFn: ({ pageParam, signal }) =>
      api.get('/api/v1/users/all', {
        query: { ...filter, page: pageParam, limit: USERS_PAGE_SIZE },
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: ({ page, totalPages }) =>
      page < totalPages ? page + 1 : undefined,
    placeholderData: keepPreviousData,
    select: selectUsers,
  });
}
