import type { ExerciseWithMuscles } from '@/api/pending';

import styles from './ExerciseMusclesLine.module.css';

/** Los músculos de un ejercicio en una sola línea: una lista larga se corta con puntos suspensivos. */
export function ExerciseMusclesLine({
  exercisedMuscles,
}: Pick<ExerciseWithMuscles, 'exercisedMuscles'>) {
  return (
    <span className={styles.line}>
      {exercisedMuscles.length === 0
        ? 'Sin músculos asignados'
        : exercisedMuscles.map((muscle) => muscle.name).join(', ')}
    </span>
  );
}
