import type { RoutineTree } from '@/api/pending';
import type { RoutineAssignedFinished } from '@/api/types';
import { capitalize } from '@/shared/lib/text';
import { List, Pill, SectionHeader } from '@/shared/ui';

import { exercisePath } from '../homeState';
import type { RoutineAssignment } from '../routineDetail';
import { RoutineExerciseRow } from './RoutineExerciseRow';
import styles from './RoutineCircuit.module.css';

interface RoutineCircuitProps {
  link: RoutineTree['circuits'][number];
  /** De qué asignación es la rutina: cada ejercicio abre su detalle bajo ella. */
  assignment: RoutineAssignment;
  finished: ReadonlyMap<string, RoutineAssignedFinished>;
}

/**
 * Un circuito de la rutina, en el lugar que ocupa en ella: "Circuito 1 · Empuje" con su tipo, y sus
 * ejercicios en orden, que abren su detalle (CU-U-10). Uno dado de baja que el alumno completó se sigue
 * viendo, avisando que lo está.
 */
export function RoutineCircuit({
  link,
  assignment,
  finished,
}: RoutineCircuitProps) {
  const { circuit, order } = link;
  const exercises = [...circuit.exercises].sort(
    (a, b) => a.exercise_order - b.exercise_order,
  );
  const title = `Circuito ${order} · ${circuit.name}`;

  return (
    <section aria-label={title}>
      <SectionHeader
        level={3}
        title={title}
        aside={
          circuit.active ? (
            capitalize(circuit.type)
          ) : (
            <Pill tone="warn">Dado de baja</Pill>
          )
        }
      />
      {exercises.length === 0 ? (
        <p className={styles.empty}>Este circuito no tiene ejercicios.</p>
      ) : (
        <List columns={2}>
          {exercises.map((exercise) => (
            <RoutineExerciseRow
              key={exercise.id}
              exercise={exercise}
              to={exercisePath(assignment, exercise.id)}
              finished={finished.get(exercise.id)}
            />
          ))}
        </List>
      )}
    </section>
  );
}
