import { ExerciseMusclesLine } from '@/features/catalog/components/ExerciseMusclesLine';
import type { CatalogExercise } from '@/features/catalog/hooks/useExerciseCatalog';
import { ListItem, Thumb } from '@/shared/ui';

interface WikiRowProps {
  exercise: CatalogExercise;
  onOpen: (exercise: CatalogExercise) => void;
}

/** Un ejercicio de la wiki: su foto, su nombre y sus músculos. Toda la fila abre la ficha. */
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
