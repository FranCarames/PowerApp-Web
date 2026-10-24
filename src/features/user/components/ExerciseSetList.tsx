import type { ReactNode } from 'react';

import type { CircuitSetResponse } from '@/api/types';
import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';
import {
  formatSetKind,
  formatSetTarget,
  setKind,
  type SetKind,
} from '@/shared/lib/sets';
import { Pill } from '@/shared/ui';

import styles from './ExerciseSetList.module.css';

/** Una serie del ejercicio: su número y el bloque de la rutina del que sale. */
export interface ExerciseSetRow {
  number: number;
  block: CircuitSetResponse;
}

interface ExerciseSetListProps {
  rows: readonly ExerciseSetRow[];
  /** Las series tildadas, por su posición (desde 0). Con `done`, el ejercicio completo cuenta como tildado. */
  ticks: ReadonlySet<number>;
  /** El ejercicio ya está marcado como hecho: todas las series se ven hechas. */
  done: boolean;
  /** Se puede tildar. Sin esto (la planificación se quitó, el plan no se marca) las series son solo informativas. */
  interactive: boolean;
  onToggle: (index: number) => void;
}

const KIND_TONE: Record<SetKind, 'mut' | 'acc'> = {
  normal: 'mut',
  amrap: 'acc',
  rm: 'acc',
};

function SetRow({
  row,
  checked,
  next,
  interactive,
  onToggle,
}: {
  row: ExerciseSetRow;
  checked: boolean;
  /** La próxima serie por hacer: se resalta, como la "Serie ahora" del prototipo. */
  next: boolean;
  interactive: boolean;
  onToggle: () => void;
}) {
  const { block, number } = row;
  const className = cx(
    styles.set,
    checked && styles.checked,
    next && styles.next,
  );
  const content: ReactNode = (
    <>
      <span className={styles.check} aria-hidden="true">
        {checked && <Icon name="check" size={12} />}
      </span>
      <span className={styles.main}>
        <span className={styles.number}>Serie {number}</span>
        <span className={styles.target}>{formatSetTarget(block)}</span>
      </span>
      <Pill tone={KIND_TONE[setKind(block)]}>{formatSetKind(block)}</Pill>
    </>
  );

  return (
    <li>
      {interactive ? (
        <button
          type="button"
          className={cx(className, styles.button)}
          aria-pressed={checked}
          onClick={onToggle}
        >
          {content}
        </button>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}

/**
 * Las series del ejercicio, una por fila (un bloque 3×8 son tres filas), cada una con su tipo (normal,
 * AMRAP o RM) y sus parámetros. El tildado es solo de la interfaz: lo que el backend guarda es el
 * ejercicio completo (CU-U-12).
 */
export function ExerciseSetList({
  rows,
  ticks,
  done,
  interactive,
  onToggle,
}: ExerciseSetListProps) {
  const nextIndex = done ? -1 : rows.findIndex((_, index) => !ticks.has(index));

  return (
    <ol className={styles.list}>
      {rows.map((row, index) => (
        <SetRow
          key={row.number}
          row={row}
          checked={done || ticks.has(index)}
          next={interactive && index === nextIndex}
          interactive={interactive}
          onToggle={() => onToggle(index)}
        />
      ))}
    </ol>
  );
}
