import type { CatalogExercise } from '@/features/catalog/hooks/useExerciseCatalog';
import { IconButton, ListItem, Thumb } from '@/shared/ui';

import styles from './ExerciseRow.module.css';

interface ExerciseRowProps {
  exercise: CatalogExercise;
  onEdit: (exercise: CatalogExercise) => void;
  onDelete: (exercise: CatalogExercise) => void;
}

/** Lo que dice la fila bajo el nombre: los músculos del ejercicio. */
function describeMuscles({ exercisedMuscles }: CatalogExercise) {
  if (exercisedMuscles.length === 0) return 'Sin músculos asignados';
  return exercisedMuscles.map((muscle) => muscle.name).join(', ');
}

/** Un ejercicio del catálogo: su foto, su nombre, sus músculos, y las acciones de editar y eliminar. */
export function ExerciseRow({ exercise, onEdit, onDelete }: ExerciseRowProps) {
  return (
    <ListItem
      leading={<Thumb src={exercise.preview_image} />}
      title={exercise.name}
      subtitle={
        <span className={styles.subtitle}>{describeMuscles(exercise)}</span>
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
