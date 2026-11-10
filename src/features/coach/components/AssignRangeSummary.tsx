import { formatRangeDay, weeksDifference } from '../assignRange';
import styles from './AssignRangeSummary.module.css';

interface AssignRangeSummaryProps {
  /** El inicio elegido (no el lunes de su semana). */
  start: string;
  /** El fin que resulta, o `null` si el inicio o las semanas no son válidos: entonces no hay resumen. */
  end: string | null;
  /** Las semanas elegidas. */
  weeks: number;
  /** La duración del plan, contra la que se comparan las semanas (0 es sin duración fija). */
  duration: number;
}

/**
 * El rango de una planificación asignada, antes de asignarla (CU-E-13, paso 2): «Del lun 9 nov al dom 29
 * nov» y, si las semanas no son las del plan, qué ve el alumno. Es una región `status` que está siempre, así
 * un lector de pantalla oye cada cambio; sin un rango válido queda vacía y no se ve.
 */
export function AssignRangeSummary({
  start,
  end,
  weeks,
  duration,
}: AssignRangeSummaryProps) {
  const difference = end === null ? null : weeksDifference(duration, weeks);

  return (
    <div role="status" className={styles.summary}>
      {end !== null && (
        <>
          <div className={styles.range}>
            Del {formatRangeDay(start)} al {formatRangeDay(end)}
          </div>
          {difference && <div className={styles.difference}>{difference}</div>}
        </>
      )}
    </div>
  );
}
