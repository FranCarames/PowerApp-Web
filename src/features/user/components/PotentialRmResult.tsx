import type { PotentialRmResponse } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { formatDecimal } from '@/shared/lib/format';
import { Card, EmptyState, SectionHeader } from '@/shared/ui';

import styles from './PotentialRmResult.module.css';

interface PotentialRmResultProps {
  /** Lo que respondió el backend. `undefined` mientras no hay un cálculo para mostrar. */
  result: PotentialRmResponse | undefined;
  /** Se está calculando otra cosa: lo que se ve es el resultado anterior. */
  stale: boolean;
  /** Hay datos completos y se espera la primera respuesta. */
  loading: boolean;
}

/** El peso de una fila de la tabla como porcentaje del 1RM estimado. */
function percentOf(weight: number, oneRm: number): number {
  return Math.round((weight / oneRm) * 100);
}

/**
 * El 1RM estimado y la tabla de 1RM a 12RM de la calculadora (CU-U-16). Los números son los que
 * calcula el backend, con hasta dos decimales: así la fila de las repeticiones que se ingresaron
 * muestra el mismo peso que se ingresó.
 */
export function PotentialRmResult({
  result,
  stale,
  loading,
}: PotentialRmResultProps) {
  const oneRm = result?.estimated_1rm;

  return (
    <div aria-live="polite" aria-busy={loading || stale}>
      <Card tone="acc" className={styles.result}>
        <div className={styles.eyebrow}>Tu 1RM estimado</div>
        <div className={cx(styles.value, (loading || stale) && styles.dim)}>
          {oneRm === undefined ? (
            '—'
          ) : (
            <>
              {formatDecimal(oneRm)}
              <span className={styles.unit}> kg</span>
            </>
          )}
        </div>
        <div className={styles.formula}>
          Fórmula de {result?.formula ?? 'Epley'}
        </div>
      </Card>

      <SectionHeader title="Tabla de 1RM a 12RM" />
      {result && oneRm !== undefined ? (
        <table className={cx(styles.table, stale && styles.dim)}>
          <thead className={styles.hidden}>
            <tr>
              <th scope="col">Porcentaje del 1RM</th>
              <th scope="col">Peso estimado</th>
              <th scope="col">Repeticiones</th>
            </tr>
          </thead>
          <tbody>
            {result.potential_rms.map(({ reps, weight }) => (
              <tr
                key={reps}
                className={reps === result.input.max_reps ? styles.mine : ''}
                aria-current={reps === result.input.max_reps || undefined}
              >
                <td>{percentOf(weight, oneRm)}%</td>
                <td>{formatDecimal(weight)} kg</td>
                <td>
                  {reps} {reps === 1 ? 'rep' : 'reps'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState
          message={
            loading
              ? 'Calculando…'
              : 'Elegí un ejercicio e ingresá el peso y las repeticiones.'
          }
        />
      )}
    </div>
  );
}
