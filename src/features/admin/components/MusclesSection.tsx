import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { MuscleWithGroup } from '@/api/pending';
import { useExercises } from '@/features/catalog/hooks/useExercises';
import { useMuscleGroups } from '@/features/catalog/hooks/useMuscleGroups';
import { useMuscles } from '@/features/catalog/hooks/useMuscles';
import { matchesSearch } from '@/shared/lib/text';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Fab,
  List,
  ListSkeleton,
  useToast,
} from '@/shared/ui';

import { useDeleteMuscle } from '../hooks/useDeleteMuscle';
import { MuscleFormModal } from './MuscleFormModal';
import { MuscleRow } from './MuscleRow';

interface MusclesSectionProps {
  /** Lo que se escribió en el buscador del catálogo. */
  search: string;
}

/** Qué decir cuando no hay músculos, según lo que se estaba buscando. */
function EmptyMuscles({
  catalogIsEmpty,
  onCreate,
}: {
  catalogIsEmpty: boolean;
  onCreate: () => void;
}) {
  if (catalogIsEmpty) {
    return (
      <EmptyState
        icon="grid"
        title="Todavía no hay músculos"
        message="Creá el primero para poder asignarlo a los ejercicios."
        action={
          <Button sm onClick={onCreate}>
            Crear músculo
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon="search"
      title="Sin coincidencias"
      message="No hay músculos con ese nombre."
    />
  );
}

/**
 * El segmento Músculos del Catálogo (CU-A-07 a CU-A-10): la lista filtrada por la búsqueda, el alta y
 * la edición en un modal, y el borrado con confirmación.
 */
export function MusclesSection({ search }: MusclesSectionProps) {
  const toast = useToast();
  const muscles = useMuscles();
  const groups = useMuscleGroups();
  // Cuántos ejercicios usa cada músculo, para avisarlo al eliminar. No bloquea nada si no llega.
  const exercises = useExercises();
  const remove = useDeleteMuscle();
  const [editing, setEditing] = useState<MuscleWithGroup | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<MuscleWithGroup | null>(null);

  const visible = muscles.data?.filter((muscle) =>
    matchesSearch(muscle.name, search),
  );
  const sortedGroups = groups.data
    ? [...groups.data].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    : undefined;
  const usedBy = toDelete
    ? exercises.data?.filter((exercise) =>
        exercise.exercisedMuscles.some(({ id }) => id === toDelete.id),
      ).length
    : undefined;

  function confirmDelete(muscle: MuscleWithGroup) {
    remove.mutate(muscle.id, {
      onSuccess: () => {
        toast.success('Músculo eliminado');
        setToDelete(null);
      },
      onError: (error) => {
        toast.error(
          getErrorMessage(error, {
            404: 'El músculo ya no existe.',
            // El backend responde 500 ante cualquier falla de integridad, sin decir el motivo (V7).
            500: 'No se pudo eliminar el músculo. Puede que todavía lo use otro dato.',
          }),
        );
        setToDelete(null);
      },
    });
  }

  return (
    <>
      {visible ? (
        visible.length === 0 ? (
          <EmptyMuscles
            catalogIsEmpty={muscles.data?.length === 0}
            onCreate={() => setEditing('new')}
          />
        ) : (
          <List columns={2}>
            {visible.map((muscle) => (
              <MuscleRow
                key={muscle.id}
                muscle={muscle}
                onEdit={setEditing}
                onDelete={setToDelete}
              />
            ))}
          </List>
        )
      ) : muscles.isError ? (
        <ErrorState
          message={getErrorMessage(muscles.error)}
          onRetry={() => void muscles.refetch()}
          retrying={muscles.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={6} />
      )}
      <Fab label="Crear músculo" onClick={() => setEditing('new')} />
      <MuscleFormModal
        target={editing}
        groups={sortedGroups}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={toDelete !== null}
        destructive
        title="Eliminar músculo"
        message={
          toDelete && (
            <>
              ¿Eliminar <b>{toDelete.name}</b>? No se puede deshacer.
              {usedBy
                ? ` Lo usa${usedBy === 1 ? '' : 'n'} ${usedBy} ejercicio${usedBy === 1 ? '' : 's'}: se quita de ${usedBy === 1 ? 'él' : 'ellos'}.`
                : ''}
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
