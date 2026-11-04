import type { RoutineHistorySet } from '@/api/types';
import { formatSetBlock } from '@/shared/lib/sets';

import styles from './HistoryPrescription.module.css';

/**
 * La prescripción de un ejercicio, un bloque por línea («3×8 · 60 kg»). Son las series de la rutina como
 * está hoy, no lo que levantó el alumno: lo dice el aviso de la lista.
 */
export function HistoryPrescription({
  sets,
}: {
  sets: readonly RoutineHistorySet[];
}) {
  return (
    <span className={styles.blocks}>
      {sets.length === 0
        ? '—'
        : sets.map((set) => (
            <span key={set.set_order}>{formatSetBlock(set)}</span>
          ))}
    </span>
  );
}
