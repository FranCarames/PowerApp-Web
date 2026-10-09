import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import { ExerciseFilters } from '@/features/catalog/components/ExerciseFilters';
import type { CatalogExercise } from '@/features/catalog/hooks/useExerciseCatalog';
import { useExerciseSearch } from '@/features/catalog/hooks/useExerciseSearch';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Fab,
  List,
  ListSkeleton,
  PageHeader,
  useToast,
} from '@/shared/ui';

import { ExerciseRow } from '../components/ExerciseRow';
import { useDeleteExercise } from '../hooks/useDeleteExercise';

/** Qué decir cuando no hay ejercicios, según lo que se estaba buscando. */
function EmptyExercises({
  catalogIsEmpty,
  searching,
  onCreate,
}: {
  catalogIsEmpty: boolean;
  searching: boolean;
  onCreate: () => void;
}) {
  if (catalogIsEmpty) {
    return (
      <EmptyState
        icon="dumbbell"
        title="Todavía no hay ejercicios"
        message="Creá el primero para que se pueda usar en los circuitos."
        action={
          <Button sm onClick={onCreate}>
            Crear ejercicio
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon="search"
      title={searching ? 'Sin coincidencias' : undefined}
      message={
        searching
          ? 'No hay ejercicios que coincidan con la búsqueda.'
          : 'No hay ejercicios con ese filtro.'
      }
    />
  );
}

/**
 * Ejercicios del Admin (CU-A-01 a CU-A-06): el catálogo con búsqueda por nombre y chips por grupo
 * muscular. Desde acá se crea, se edita (en `/a/ejercicios/:id`) y se elimina. La búsqueda y el chip
 * quedan en la URL.
 */
export function ExercisesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { catalog, search, setSearch, group, setGroup, visible, searching } =
    useExerciseSearch();
  const remove = useDeleteExercise();
  const [toDelete, setToDelete] = useState<CatalogExercise | null>(null);

  function confirmDelete(exercise: CatalogExercise) {
    remove.mutate(exercise.id, {
      onSuccess: () => {
        toast.success('Ejercicio eliminado');
        setToDelete(null);
      },
      onError: (error) => {
        toast.error(
          getErrorMessage(error, {
            404: 'El ejercicio ya no existe.',
            // El backend rechaza el borrado de un ejercicio con RMs o entrenamientos hechos (V7).
            500: 'No se pudo eliminar el ejercicio. Si alguien registró un RM o ya entrenó con él, no se puede borrar.',
          }),
        );
        setToDelete(null);
      },
    });
  }

  return (
    <>
      <PageHeader eyebrow="Entrenamiento" title="Ejercicios" />
      <ExerciseFilters
        search={search}
        onSearch={setSearch}
        groups={catalog.groups}
        group={group}
        onGroup={setGroup}
      />
      {visible ? (
        visible.length === 0 ? (
          <EmptyExercises
            catalogIsEmpty={catalog.exercises?.length === 0}
            searching={searching}
            onCreate={() => navigate('/a/ejercicios/nuevo')}
          />
        ) : (
          <List columns={2}>
            {visible.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                onEdit={() => navigate(`/a/ejercicios/${exercise.id}`)}
                onDelete={setToDelete}
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
      <Fab
        label="Crear ejercicio"
        onClick={() => navigate('/a/ejercicios/nuevo')}
      />
      <ConfirmDialog
        open={toDelete !== null}
        destructive
        title="Eliminar ejercicio"
        message={
          toDelete && (
            <>
              ¿Eliminar <b>{toDelete.name}</b>? No se puede deshacer. Si está en
              circuitos, se quita de ellos; si alguien registró un RM o ya
              entrenó con él, no se puede eliminar.
            </>
          )
        }
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onConfirm={() => toDelete && confirmDelete(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
