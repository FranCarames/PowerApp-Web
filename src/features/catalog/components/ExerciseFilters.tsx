import { Chip, ChipGroup, SearchInput } from '@/shared/ui';

import type { CatalogGroup } from '../hooks/useExerciseCatalog';

interface ExerciseFiltersProps {
  search: string;
  onSearch: (search: string) => void;
  /** Los grupos musculares, que llegan con el catálogo: mientras tanto solo está "Todos". */
  groups: readonly CatalogGroup[] | undefined;
  /** El grupo elegido, o `null` para "Todos". */
  group: CatalogGroup | null;
  onGroup: (groupId: string | null) => void;
}

/** El buscador por nombre y los chips de grupo muscular de las listas de ejercicios. */
export function ExerciseFilters({
  search,
  onSearch,
  groups,
  group,
  onGroup,
}: ExerciseFiltersProps) {
  return (
    <>
      <SearchInput
        placeholder="Buscar ejercicio"
        value={search}
        autoComplete="off"
        onChange={(event) => onSearch(event.target.value)}
      />
      <ChipGroup aria-label="Filtrar por grupo muscular">
        <Chip selected={group === null} onClick={() => onGroup(null)}>
          Todos
        </Chip>
        {groups?.map(({ id, name }) => (
          <Chip
            key={id}
            selected={group?.id === id}
            onClick={() => onGroup(id)}
          >
            {name}
          </Chip>
        ))}
      </ChipGroup>
    </>
  );
}
