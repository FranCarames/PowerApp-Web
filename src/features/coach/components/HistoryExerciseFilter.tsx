import { useId, useState } from 'react';

import { Icon } from '@/shared/icons';
import { topExercises, type ExerciseTimes } from '@/shared/lib/trainingHistory';
import { Chip, ChipGroup } from '@/shared/ui';

import styles from './HistoryExerciseFilter.module.css';
import { HistoryExercisePicker } from './HistoryExercisePicker';

interface HistoryExerciseFilterProps {
  /** Los ejercicios que hizo el alumno, con sus veces (del historial completo). */
  done: readonly ExerciseTimes[];
  /** El ejercicio abierto en el detalle, o `null` en la lista («Todos»). */
  selected: { id: string; name: string } | null;
  /** `null` es «Todos»: vuelve a la lista. */
  onSelect: (exerciseId: string | null) => void;
}

/**
 * «Filtrar por ejercicio» (6.3): «Todos», los 3 que hizo en más sesiones, el abierto si no está entre esos
 * y «Otro…», que abre el buscador. Elegir un ejercicio abre su detalle (CU-E-07).
 */
export function HistoryExerciseFilter({
  done,
  selected,
  onSelect,
}: HistoryExerciseFilterProps) {
  const id = useId();
  const pickerId = `${id}-buscador`;
  const [picking, setPicking] = useState(false);

  const top = topExercises(done);
  const chips =
    selected && !top.some(({ id: exerciseId }) => exerciseId === selected.id)
      ? [...top, selected]
      : top;

  function select(exerciseId: string | null) {
    setPicking(false);
    onSelect(exerciseId);
  }

  return (
    <section aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className={styles.title}>
        Filtrar por ejercicio
      </h2>
      <ChipGroup wrap className={styles.chips}>
        <Chip selected={selected === null} onClick={() => select(null)}>
          Todos
        </Chip>
        {chips.map((exercise) => (
          <Chip
            key={exercise.id}
            selected={exercise.id === selected?.id}
            className={styles.chip}
            onClick={() => select(exercise.id)}
          >
            {exercise.name}
          </Chip>
        ))}
        <Chip
          selected={picking}
          aria-pressed={undefined}
          aria-expanded={picking}
          aria-controls={pickerId}
          className={styles.other}
          onClick={() => setPicking(!picking)}
        >
          <Icon name="search" size={15} />
          Otro…
        </Chip>
      </ChipGroup>
      {picking && (
        <HistoryExercisePicker
          id={pickerId}
          done={done}
          onSelect={(exerciseId) => select(exerciseId)}
        />
      )}
    </section>
  );
}
