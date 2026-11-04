import { useEffect, useRef, useState } from 'react';

import { useExercises } from '@/features/catalog/hooks/useExercises';
import {
  byName,
  plural,
  type ExerciseTimes,
} from '@/shared/lib/trainingHistory';
import { matchesSearch } from '@/shared/lib/text';
import { Card, Field, Input } from '@/shared/ui';

import styles from './HistoryExercisePicker.module.css';

interface HistoryExercisePickerProps {
  id: string;
  /** Los que hizo el alumno, con sus veces (del historial completo). */
  done: readonly ExerciseTimes[];
  onSelect: (exerciseId: string) => void;
}

/**
 * El buscador de «Otro…» (6.3): los que hizo el alumno, con sus veces, y el resto del catálogo, cada grupo
 * por orden alfabético. La búsqueda no distingue mayúsculas ni tildes. Si el catálogo no carga, quedan
 * solo los que hizo. Se monta al abrirse, así que el catálogo se pide recién ahí.
 */
export function HistoryExercisePicker({
  id,
  done,
  onSelect,
}: HistoryExercisePickerProps) {
  const catalog = useExercises();
  const [search, setSearch] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const doneIds = new Set(done.map(({ id: exerciseId }) => exerciseId));
  const mine = done.filter(({ name }) => matchesSearch(name, search));
  const others = (catalog.data ?? [])
    .filter(
      ({ id: exerciseId, name }) =>
        !doneIds.has(exerciseId) && matchesSearch(name, search),
    )
    .map(({ id: exerciseId, name }) => ({ id: exerciseId, name }))
    .sort(byName);

  return (
    <Card id={id} className={styles.picker}>
      <Field label="Buscar ejercicio" className={styles.field}>
        <Input
          ref={input}
          type="search"
          value={search}
          placeholder="Sentadilla, remo…"
          autoComplete="off"
          onChange={(event) => setSearch(event.target.value)}
        />
      </Field>
      {mine.length > 0 && (
        <div role="group" aria-labelledby={`${id}-mine`}>
          <div id={`${id}-mine`} className={styles.group}>
            Los que hizo el alumno
          </div>
          {mine.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className={styles.option}
              onClick={() => onSelect(exercise.id)}
            >
              <span>{exercise.name}</span>
              <span className={styles.meta}>
                {plural(exercise.times, 'vez', 'veces')}
              </span>
            </button>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div role="group" aria-labelledby={`${id}-others`}>
          <div id={`${id}-others`} className={styles.group}>
            Otros del catálogo
          </div>
          {others.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className={styles.option}
              onClick={() => onSelect(exercise.id)}
            >
              <span>{exercise.name}</span>
              <span className={styles.meta}>Sin registros</span>
            </button>
          ))}
        </div>
      )}
      {mine.length === 0 && others.length === 0 && (
        <p className={styles.none}>No hay ejercicios con ese nombre.</p>
      )}
    </Card>
  );
}
