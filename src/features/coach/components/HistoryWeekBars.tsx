import { dayParts, type Day } from '@/shared/lib/trainingHistory';
import { cx } from '@/shared/lib/cx';

import styles from './HistoryWeekBars.module.css';

/** Un tramo de una barra: las sesiones del plan (violeta), las individuales (naranja) o las veces (verde). */
interface BarSegment {
  value: number;
  tone: 'plan' | 'individual' | 'ok';
}

export interface WeekBarItem {
  monday: Day;
  current: boolean;
  future: boolean;
  /** El número de arriba. */
  total: number;
  /** De arriba hacia abajo: en «Sesiones de …», las individuales y después las del plan. */
  segments: BarSegment[];
  /** El texto alternativo con los números (spec 11). */
  label: string;
  /** El contorno violeta de la semana elegida en la lista (en lugar del gris de la actual). */
  highlighted?: boolean;
  /** Solo en las barras que son botones: sin él, el botón queda deshabilitado. */
  onSelect?: () => void;
}

interface HistoryWeekBarsProps {
  items: readonly WeekBarItem[];
  /** El valor que llena una barra (9.6). */
  scale: number;
  /** Botones (las de «Sesiones de …») o imágenes (las de «Veces en …»). */
  interactive: boolean;
  /** Más bajas y angostas: las de «Veces en …». */
  compact?: boolean;
}

/**
 * Una barra por semana (`.bars.hb` del prototipo): el total arriba, la pista con sus tramos y el lunes
 * abajo, en dos líneas. Las futuras van punteadas y sin número. El número, la pista y el lunes son
 * decorativos: lo que se anuncia es el `label`.
 */
export function HistoryWeekBars({
  items,
  scale,
  interactive,
  compact = false,
}: HistoryWeekBarsProps) {
  return (
    <div className={cx(styles.bars, compact && styles.compact)}>
      {items.map((item) => {
        const { date, month } = dayParts(item.monday);
        const content = (
          <>
            <span
              className={cx(styles.count, item.total === 0 && styles.zero)}
              aria-hidden="true"
            >
              {item.future ? '' : item.total}
            </span>
            <span
              className={cx(
                styles.track,
                item.future && styles.future,
                item.highlighted
                  ? styles.highlighted
                  : item.current && styles.current,
              )}
              aria-hidden="true"
            >
              {!item.future &&
                item.segments
                  .filter(({ value }) => value > 0)
                  .map(({ value, tone }) => (
                    <span
                      key={tone}
                      className={styles[tone]}
                      style={{ height: `${(value / scale) * 100}%` }}
                    />
                  ))}
            </span>
            <small className={styles.monday} aria-hidden="true">
              <b className={cx(item.current && styles.currentDay)}>{date}</b>
              {month}
            </small>
          </>
        );

        return interactive ? (
          <button
            key={item.monday}
            type="button"
            className={styles.bar}
            disabled={!item.onSelect}
            aria-label={item.label}
            onClick={item.onSelect}
          >
            {content}
          </button>
        ) : (
          <div
            key={item.monday}
            className={styles.bar}
            role="img"
            aria-label={item.label}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
