import {
  keepPreviousData,
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PaginatedUsers, User } from '@/api/types';

/** Cuántos alumnos trae cada página. Es el valor por defecto del backend. */
export const STUDENTS_PAGE_SIZE = 20;

export interface StudentsFilter {
  /** Texto a buscar en nombre, apellido y email. Vacío o sin definir: no filtra. */
  keyword?: string;
  /** Estado de la cuenta. Sin definir: todos. */
  active?: boolean;
}

/**
 * Los alumnos cargados hasta ahora, en un solo arreglo, y cuántos hay en total con ese filtro. Las
 * páginas se piden con offset: si un alumno cambia de lugar mientras se carga la página siguiente,
 * viene en las dos, y la fila se muestra una sola vez.
 */
function selectStudents({ pages }: InfiniteData<PaginatedUsers>) {
  const unique = new Map<string, User>();
  for (const page of pages) {
    for (const student of page.data) unique.set(student.id, student);
  }
  return { students: [...unique.values()], total: pages.at(-1)?.total ?? 0 };
}

/**
 * `GET /users/all?role=user`: los alumnos, de a páginas. No existe un vínculo entrenador-alumno:
 * "alumnos" son todos los usuarios con `role=user`. El backend los devuelve del más nuevo al más
 * viejo y la búsqueda es de coincidencia parcial. Mientras llega el resultado de una búsqueda nueva
 * se sigue mostrando el anterior (`isPlaceholderData`).
 */
export function useStudents({ keyword, active }: StudentsFilter) {
  const filter = { keyword: keyword || undefined, active };

  return useInfiniteQuery({
    queryKey: queryKeys.users.students(filter),
    queryFn: ({ pageParam, signal }) =>
      api.get('/api/v1/users/all', {
        query: {
          role: 'user',
          ...filter,
          page: pageParam,
          limit: STUDENTS_PAGE_SIZE,
        },
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: ({ page, totalPages }) =>
      page < totalPages ? page + 1 : undefined,
    placeholderData: keepPreviousData,
    select: selectStudents,
  });
}
