import { ExerciseMusclesLine } from '@/features/catalog/components/ExerciseMusclesLine';
import type { CatalogExercise } from '@/features/catalog/hooks/useExerciseCatalog';
import { IconButton, ListItem, Thumb } from '@/shared/ui';

interface ExerciseRowProps {
  exercise: CatalogExercise;
  onEdit: (exercise: CatalogExercise) => void;
  onDelete: (exercise: CatalogExercise) => void;
}

/** Un ejercicio del catálogo: su foto, su nombre, sus músculos, y las acciones de editar y eliminar. */
export function ExerciseRow({ exercise, onEdit, onDelete }: ExerciseRowProps) {
  return (
    <ListItem
      leading={<Thumb src={exercise.preview_image} />}
      title={exercise.name}
      subtitle={
        <ExerciseMusclesLine exercisedMuscles={exercise.exercisedMuscles} />
      }
      trailing={
        <>
          <IconButton
            variant="ghost"
            icon="edit"
            label={`Editar ${exercise.name}`}
            onClick={() => onEdit(exercise)}
          />
          <IconButton
            variant="ghost"
            danger
            icon="trash"
            label={`Eliminar ${exercise.name}`}
            onClick={() => onDelete(exercise)}
          />
        </>
      }
    />
  );
}
