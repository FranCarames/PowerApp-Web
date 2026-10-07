import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { ExerciseWithMuscles } from '@/api/pending';
import { useExercises } from '@/features/catalog/hooks/useExercises';
import { matchesSearch } from '@/shared/lib/text';
import {
  Button,
  EmptyState,
  ErrorState,
  List,
  ListItem,
  ListSkeleton,
  Modal,
  SearchInput,
  Thumb,
} from '@/shared/ui';

interface ExercisePickerModalProps {
  open: boolean;
  /** Los ejercicios que el circuito ya tiene: no se vuelven a ofrecer (no se pueden repetir). */
  selectedIds: readonly string[];
  onPick: (exercise: ExerciseWithMuscles) => void;
  onClose: () => void;
}

/** Elegir un ejercicio del catálogo para el circuito (CU-E-22): buscador por nombre y los que faltan. */
export function ExercisePickerModal({
  open,
  selectedIds,
  onPick,
  onClose,
}: ExercisePickerModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar ejercicio"
      actions={
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      }
    >
      {/* El contenido solo existe con el modal abierto: la búsqueda arranca vacía cada vez. */}
      {open && <PickerContent selectedIds={selectedIds} onPick={onPick} />}
    </Modal>
  );
}

function PickerContent({
  selectedIds,
  onPick,
}: Pick<ExercisePickerModalProps, 'selectedIds' | 'onPick'>) {
  const exercises = useExercises();
  const [search, setSearch] = useState('');

  const available = exercises.data
    ?.filter(({ id }) => !selectedIds.includes(id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const visible = available?.filter(({ name }) => matchesSearch(name, search));

  return (
    <>
      <SearchInput
        placeholder="Buscar ejercicio"
        value={search}
        maxLength={50}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      {visible ? (
        visible.length === 0 ? (
          <EmptyState
            icon="search"
            message={
              available?.length === 0
                ? 'Ya agregaste todos los ejercicios del catálogo.'
                : 'No hay ejercicios con ese nombre.'
            }
          />
        ) : (
          <List gap={8}>
            {visible.map((exercise) => (
              <ListItem
                key={exercise.id}
                leading={
                  <Thumb size={40} src={exercise.preview_image ?? undefined} />
                }
                title={exercise.name}
                subtitle={exercise.exercisedMuscles
                  .map(({ name }) => name)
                  .join(', ')}
                onClick={() => onPick(exercise)}
              />
            ))}
          </List>
        )
      ) : exercises.isError ? (
        <ErrorState
          message={getErrorMessage(exercises.error)}
          onRetry={() => void exercises.refetch()}
          retrying={exercises.isRefetching}
        />
      ) : (
        <ListSkeleton rows={4} />
      )}
    </>
  );
}
