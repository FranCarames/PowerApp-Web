import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
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

// Lo que responde `deleteExercise` (con un 409) según por qué no se puede borrar el ejercicio.
const IN_CIRCUITS_MESSAGE =
  'No se puede eliminar el ejercicio: está en uso en circuitos';
const TRAINED_MESSAGE =
  'No se puede eliminar el ejercicio: ya se entrenó con él';
const WITH_RMS_MESSAGE =
  'No se puede eliminar el ejercicio: hay alumnos con RMs registrados';

/**
 * El aviso por un 409 al eliminar, según el motivo que dice el backend. El texto del servidor no se
 * muestra: uno que no se reconoce cae en el aviso genérico de "en uso".
 */
function deleteConflictMessage(serverMessage: string | null): string {
  switch (serverMessage) {
    case IN_CIRCUITS_MESSAGE:
      return 'No se puede eliminar: el ejercicio está en uno o más circuitos. Quitalo de ellos y probá de nuevo.';
    case TRAINED_MESSAGE:
      return 'No se puede eliminar: hay alumnos que ya entrenaron con este ejercicio.';
    case WITH_RMS_MESSAGE:
      return 'No se puede eliminar: hay alumnos con RMs registrados de este ejercicio.';
    default:
      return 'No se puede eliminar el ejercicio porque está en uso.';
  }
}

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
            409: deleteConflictMessage(
              isApiError(error) ? error.serverMessage : null,
            ),
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
              circuitos, tiene RMs registrados o ya se entrenó con él, no se
              puede eliminar.
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
