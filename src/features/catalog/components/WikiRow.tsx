import { ListItem, Thumb } from '@/shared/ui';

import type { CatalogExercise } from '../hooks/useExerciseCatalog';
import { ExerciseMusclesLine } from './ExerciseMusclesLine';

interface WikiRowProps {
  exercise: CatalogExercise;
  onOpen: (exercise: CatalogExercise) => void;
}

/** Un ejercicio de la biblioteca: su foto, su nombre y sus músculos. Toda la fila abre la ficha. */
export function WikiRow({ exercise, onOpen }: WikiRowProps) {
  return (
    <ListItem
      leading={<Thumb src={exercise.preview_image} />}
      title={exercise.name}
      subtitle={
        <ExerciseMusclesLine exercisedMuscles={exercise.exercisedMuscles} />
      }
      chevron
      onClick={() => onOpen(exercise)}
    />
  );
}
