import type { CircuitListItemPlus } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { capitalize } from '@/shared/lib/text';
import { Card, Pill, Tile } from '@/shared/ui';

import styles from './CircuitCard.module.css';

interface CircuitCardProps {
  circuit: CircuitListItemPlus;
  /** En cuántas rutinas se usa, si ya se sabe. Sin el dato, la tarjeta no lo dice. */
  routines?: number;
  onOpen: (circuit: CircuitListItemPlus) => void;
}

/**
 * Un circuito (CU-E-21): su nombre, su tipo y cuántos ejercicios tiene, en cuántas rutinas se usa y la
 * lista de sus ejercicios. Si está dado de baja, se ve apagado con "Inactivo". Tocarlo abre su editor,
 * donde también se lo da de baja o se lo reactiva.
 */
export function CircuitCard({ circuit, routines, onOpen }: CircuitCardProps) {
  const count = circuit.exercise_count;
  const exercises = circuit.exercises.map(({ exercise }) => exercise.name);

  return (
    <Card
      className={cx(styles.card, !circuit.active && styles.inactive)}
      onClick={() => onOpen(circuit)}
    >
      <span className={styles.head}>
        <Tile icon="cycle" tone="acc" />
        <span className={styles.text}>
          <span className={styles.name}>{circuit.name}</span>
          <span className={styles.sub}>
            {capitalize(circuit.type)} · {count} ejercicio
            {count === 1 ? '' : 's'}
          </span>
        </span>
        {!circuit.active ? (
          <Pill tone="warn">Inactivo</Pill>
        ) : (
          routines !== undefined && (
            <Pill tone="acc">
              {routines} rutina{routines === 1 ? '' : 's'}
            </Pill>
          )
        )}
      </span>
      <span className={styles.exercises}>
        {exercises.length > 0 ? exercises.join(', ') : 'Sin ejercicios'}
      </span>
    </Card>
  );
}
