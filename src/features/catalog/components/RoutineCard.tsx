import type { RoutineListItemPlus } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { ListItem, Pill } from '@/shared/ui';

import styles from './RoutineCard.module.css';

interface RoutineCardProps {
  routine: RoutineListItemPlus;
  /** Cuántos ejercicios suman sus circuitos, si ya se sabe. Sin el dato, la tarjeta cuenta solo los circuitos. */
  exercises?: number;
  onOpen: (routine: RoutineListItemPlus) => void;
}

/** "12 ejercicios · 3 circuitos", o solo los circuitos mientras no se sepan los ejercicios. */
function summary(circuits: number, exercises: number | undefined): string {
  if (circuits === 0) return 'Sin circuitos';
  const circuitsText = `${circuits} circuito${circuits === 1 ? '' : 's'}`;
  if (exercises === undefined) return circuitsText;
  return `${exercises} ejercicio${exercises === 1 ? '' : 's'} · ${circuitsText}`;
}

/**
 * Una rutina (CU-E-15): su nombre, su nota del entrenador, cuántos ejercicios y circuitos tiene. Si
 * está dada de baja, se ve apagada con "Inactiva". Tocarla abre su editor, donde también se la da de
 * baja o se la reactiva.
 */
export function RoutineCard({ routine, exercises, onOpen }: RoutineCardProps) {
  return (
    <ListItem
      className={cx(!routine.active && styles.inactive)}
      title={<span className={styles.name}>{routine.name}</span>}
      // El backend manda `null` en la nota que no tiene, aunque el contrato la declara opcional.
      subtitle={
        routine.coach_note ? (
          <span className={styles.note}>{routine.coach_note}</span>
        ) : undefined
      }
      meta={summary(routine.circuit_count, exercises)}
      trailing={!routine.active && <Pill tone="warn">Inactiva</Pill>}
      chevron
      onClick={() => onOpen(routine)}
    />
  );
}
