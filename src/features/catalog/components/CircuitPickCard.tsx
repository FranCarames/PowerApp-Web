import type { CircuitListItemPlus } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { Card, Pill, Tile, VisuallyHidden } from '@/shared/ui';

import { circuitSubtitle } from '../circuitTypes';
import { inRoutineLabel } from '../routineCircuits';
import styles from './CircuitPickCard.module.css';

interface CircuitPickCardProps {
  circuit: CircuitListItemPlus;
  /** Su lugar entre los elegidos (1, 2, 3…), o `0` si no está elegido. */
  position: number;
  /** Cuántas veces ya está en la rutina: se avisa, pero se puede volver a elegir. */
  inRoutine: number;
  /** Ya no queda lugar en la rutina: si no está elegido, no se puede elegir (desmarcar, sí). */
  blocked: boolean;
  onToggle: (circuit: CircuitListItemPlus) => void;
}

/**
 * Un circuito en «Agregar circuitos» (`.addc` del prototipo): un botón que se prende y se apaga, con
 * el nombre, «<tipo> · N ejercicios», sus ejercicios en orden y, si ya está en la rutina, «En la
 * rutina» o «En la rutina ×N». Elegido, lleva su número de orden, que el lector de pantalla también
 * lee («elegido en el lugar 2»).
 */
export function CircuitPickCard({
  circuit,
  position,
  inRoutine,
  blocked,
  onToggle,
}: CircuitPickCardProps) {
  const exercises = circuit.exercises.map(({ exercise }) => exercise.name);
  const picked = position > 0;
  const disabled = blocked && !picked;

  return (
    <Card
      className={cx(styles.card, picked && styles.on)}
      aria-pressed={picked}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onToggle(circuit);
      }}
    >
      <span className={styles.row}>
        <Tile icon="cycle" tone="acc" />
        <span className={styles.text}>
          <span className={styles.name}>{circuit.name}</span>
          <span className={styles.sub}>{circuitSubtitle(circuit)}</span>
          <span className={styles.exercises}>
            {exercises.length > 0 ? exercises.join(', ') : 'Sin ejercicios'}
          </span>
          {inRoutine > 0 && (
            <span className={styles.tag}>
              <Pill tone="acc">{inRoutineLabel(inRoutine)}</Pill>
            </span>
          )}
        </span>
        <span className={styles.number} aria-hidden="true">
          {picked ? position : ''}
        </span>
        {picked && (
          <VisuallyHidden>, elegido en el lugar {position}</VisuallyHidden>
        )}
      </span>
    </Card>
  );
}
