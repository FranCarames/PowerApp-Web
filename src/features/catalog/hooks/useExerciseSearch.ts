import { matchesSearch } from '@/shared/lib/text';
import { useSearchAndFilter } from '@/shared/lib/useSearchAndFilter';

import { useExerciseCatalog } from './useExerciseCatalog';

/**
 * El catálogo de ejercicios con el buscador por nombre y el chip de grupo muscular de las listas de
 * ejercicios (el Admin en T31 y la wiki del alumno en T28). La búsqueda y el grupo quedan en la URL
 * (`?q=…&grupo=<id>`). `visible` son los ejercicios que pasan los dos filtros, o `undefined` mientras
 * el catálogo no llegó.
 */
export function useExerciseSearch() {
  const catalog = useExerciseCatalog();
  const { search, setSearch, filter, setFilter } = useSearchAndFilter('grupo');

  // Un grupo de la URL que ya no existe se trata como "Todos".
  const group = catalog.groups?.find(({ id }) => id === filter) ?? null;
  const visible = catalog.exercises?.filter(
    (exercise) =>
      (group === null || exercise.groups.some(({ id }) => id === group.id)) &&
      matchesSearch(exercise.name, search),
  );

  return {
    catalog,
    search,
    setSearch,
    group,
    setGroup: setFilter,
    visible,
    /** Si hay un texto buscado: sirve para decir por qué no hay resultados. */
    searching: search.trim() !== '',
  };
}
