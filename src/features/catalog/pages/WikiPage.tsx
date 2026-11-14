import type { ReactNode } from 'react';
import { useLocation, useNavigate, type To } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import {
  EmptyState,
  ErrorState,
  List,
  ListSkeleton,
  PageHeader,
} from '@/shared/ui';

import { ExerciseFilters } from '../components/ExerciseFilters';
import { LibrarySegments } from '../components/LibrarySegments';
import { WikiRow } from '../components/WikiRow';
import type { CatalogExercise } from '../hooks/useExerciseCatalog';
import { useExerciseSearch } from '../hooks/useExerciseSearch';
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

interface WikiPageProps {
  /** De dónde cuelga la ficha: `/u/wiki` (Usuario) o `/c/ejercicios` (Entrenador). */
  basePath: string;
  /** Destino de "Volver". Sin él, no se muestra. */
  back?: To;
  /** Lo que va entre el encabezado y el buscador: los segmentos del tab Rutinas del Entrenador. */
  nav?: ReactNode;
}

/**
 * La biblioteca de ejercicios, solo de lectura: la wiki del Usuario (CU-U-15) y la del Entrenador
 * (CU-E-30). El catálogo con búsqueda por nombre y chips por grupo muscular. Cada ejercicio abre su
 * ficha en `<basePath>/:id`. La búsqueda y el grupo quedan en la URL.
 */
export function WikiPage({ basePath, back, nav }: WikiPageProps) {
  const navigate = useNavigate();
  const { search: locationSearch } = useLocation();
  const { catalog, search, setSearch, group, setGroup, visible, searching } =
    useExerciseSearch();

  function openExercise({ id }: CatalogExercise) {
    const state: WikiLocationState = { listSearch: locationSearch };
    void navigate(`${basePath}/${id}`, { state });
  }

  return (
    <>
      <PageHeader eyebrow="Biblioteca" title="Ejercicios" back={back} />
      {nav}
      <LibrarySegments basePath={basePath} value="ejercicios" />
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
