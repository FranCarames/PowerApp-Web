import { useLocation, useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import { ExerciseFilters } from '@/features/catalog/components/ExerciseFilters';
import type { CatalogExercise } from '@/features/catalog/hooks/useExerciseCatalog';
import { useExerciseSearch } from '@/features/catalog/hooks/useExerciseSearch';
import {
  EmptyState,
  ErrorState,
  List,
  ListSkeleton,
  PageHeader,
} from '@/shared/ui';

import { WikiRow } from '../components/WikiRow';
import type { WikiLocationState } from '../wikiState';

/** Qué decir cuando no hay ejercicios que mostrar, según lo que se estaba buscando. */
function EmptyWiki({
  catalogIsEmpty,
  searching,
}: {
  catalogIsEmpty: boolean;
  searching: boolean;
}) {
  if (catalogIsEmpty) {
    return (
      <EmptyState
        icon="dumbbell"
        title="Todavía no hay ejercicios"
        message="Cuando se carguen, los vas a encontrar acá."
      />
    );
  }
  return (
    <EmptyState
      icon="search"
      message={
        searching
          ? 'No hay ejercicios con ese nombre. Probá con otra búsqueda o categoría.'
          : 'No hay ejercicios en esa categoría. Probá con otra.'
      }
    />
  );
}

/**
 * Wiki de ejercicios del Usuario (CU-U-15): el catálogo con búsqueda por nombre y chips por grupo
 * muscular. Cada ejercicio abre su ficha en `/u/wiki/:id`. La búsqueda y el grupo quedan en la URL.
 */
export function WikiPage() {
  const navigate = useNavigate();
  const { search: locationSearch } = useLocation();
  const { catalog, search, setSearch, group, setGroup, visible, searching } =
    useExerciseSearch();

  function openExercise({ id }: CatalogExercise) {
    const state: WikiLocationState = { listSearch: locationSearch };
    void navigate(`/u/wiki/${id}`, { state });
  }

  return (
    <>
      <PageHeader eyebrow="Biblioteca" title="Ejercicios" back="/u/plan" />
      <ExerciseFilters
        search={search}
        onSearch={setSearch}
        groups={catalog.groups}
        group={group}
        onGroup={setGroup}
      />
      {visible ? (
        visible.length === 0 ? (
          <EmptyWiki
            catalogIsEmpty={catalog.exercises?.length === 0}
            searching={searching}
          />
        ) : (
          <List columns={2}>
            {visible.map((exercise) => (
              <WikiRow
                key={exercise.id}
                exercise={exercise}
                onOpen={openExercise}
              />
            ))}
          </List>
        )
      ) : catalog.isError ? (
        <ErrorState
          message={getErrorMessage(catalog.error)}
          onRetry={catalog.refetch}
          retrying={catalog.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={6} />
      )}
    </>
  );
}
