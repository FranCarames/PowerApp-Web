import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button, Card, Field, IconButton, Input, Thumb } from '@/shared/ui';

import { emptySetBlock, type CircuitInput } from '../circuitSchema';
import { CircuitSetFields } from './CircuitSetFields';
import styles from './CircuitExerciseCard.module.css';

interface CircuitExerciseCardProps {
  /** Su lugar en el circuito, de 0 a `count - 1`. */
  index: number;
  count: number;
  /** Un lugar arriba (`-1`) o abajo (`1`). */
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

/**
 * Un ejercicio del circuito: su nombre, su nota del entrenador y sus bloques de series, con los botones
 * para subirlo, bajarlo y quitarlo. El orden de la lista es el orden del circuito.
 */
export function CircuitExerciseCard({
  index,
  count,
  onMove,
  onRemove,
}: CircuitExerciseCardProps) {
  const {
    register,
    getValues,
    formState: { errors },
  } = useFormContext<CircuitInput>();
  const sets = useFieldArray({ name: `exercises.${index}.sets` });
  const name = getValues(`exercises.${index}.name`);
  const fieldErrors = errors.exercises?.[index];

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <Thumb size={40} />
        <div className={styles.text}>
          <div className={styles.name}>{name}</div>
          <div className={styles.sub}>
            {sets.fields.length} bloque{sets.fields.length === 1 ? '' : 's'} de
            series
          </div>
        </div>
        <div className={styles.actions}>
          <IconButton
            variant="ghost"
            icon="chev"
            className={styles.up}
            label={`Subir ${name}`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          />
          <IconButton
            variant="ghost"
            icon="chev"
            className={styles.down}
            label={`Bajar ${name}`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          />
          <IconButton
            variant="ghost"
            danger
            icon="x"
            label={`Quitar ${name}`}
            onClick={onRemove}
          />
        </div>
      </div>
      {fieldErrors?.message && (
        <div role="alert" className={styles.error}>
          {fieldErrors.message}
        </div>
      )}
      <Field
        label="Nota del entrenador"
        error={fieldErrors?.coach_note?.message}
        hint="Opcional. La ve quien hace la rutina."
      >
        <Input
          maxLength={100}
          autoComplete="off"
          placeholder="Ej: Bajar lento en 3 segundos"
          {...register(`exercises.${index}.coach_note`)}
        />
      </Field>
      {sets.fields.map((field, setIndex) => (
        <CircuitSetFields
          key={field.id}
          exerciseIndex={index}
          setIndex={setIndex}
          exerciseName={name}
          canRemove={sets.fields.length > 1}
          onRemove={() => sets.remove(setIndex)}
        />
      ))}
      <Button
        variant="ghost"
        dashed
        icon="plus"
        className={styles.add}
        onClick={() => sets.append(emptySetBlock())}
      >
        Agregar bloque de series
      </Button>
    </Card>
  );
}
