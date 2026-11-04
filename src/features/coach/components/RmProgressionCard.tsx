import { getErrorMessage } from '@/api/errors';
import { joinWithAnd } from '@/shared/lib/text';
import {
  formatDayWithYear,
  formatRm,
  formatShortDay,
  plural,
  rmChart,
  type Day,
  type RmPoint,
} from '@/shared/lib/trainingHistory';
import { formatWeight } from '@/shared/lib/format';
import { cx } from '@/shared/lib/cx';
import { ErrorState, Pill, Skeleton } from '@/shared/ui';

import { HistoryChartCard } from './HistoryChartCard';
import styles from './RmProgressionCard.module.css';

interface RmProgressionCardProps {
  exerciseName: string;
  /** Los RMs del ejercicio por fecha (9.8), o `undefined` mientras cargan o si fallaron. */
  points: readonly RmPoint[] | undefined;
  error: Error | null;
  onRetry: () => void;
  retrying: boolean;
  today: Day;
}

/**
 * «Progresión del RM» (8.3): sale de los RMs que registró el alumno (CU-E-04), nunca del peso prescripto
 * (D57). Con 2 o más, una línea con un punto por RM y la diferencia; con uno, su valor; sin ninguno, un
 * aviso. Se muestra aunque el alumno no haya hecho nunca el ejercicio.
 */
export function RmProgressionCard({
  exerciseName,
  points,
  error,
  onRetry,
  retrying,
  today,
}: RmProgressionCardProps) {
  const chart = points && points.length >= 2 ? rmChart(points) : null;

  let subtitle = '';
  if (points) {
    if (points.length >= 2) {
      subtitle = `${plural(points.length, 'registro', 'registros')} desde el ${formatShortDay(points[0].day, today)}`;
    } else {
      subtitle = points.length === 1 ? 'Un solo registro' : 'Sin registros';
    }
  }

  let body;
  if (error) {
    body = (
      <ErrorState
        className={styles.state}
        message={getErrorMessage(error)}
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  } else if (!points) {
    body = <Skeleton height={140} radius={12} className={styles.state} />;
  } else if (chart) {
    const description = `RM de ${exerciseName}: ${joinWithAnd(
      chart.points.map(
        (point) => `${formatRm(point)} el ${formatShortDay(point.day, today)}`,
      ),
    )}`;
    const last = chart.points.length - 1;
    body = (
      <div role="img" aria-label={description}>
        <div className={styles.chart} aria-hidden="true">
          <div className={styles.middle} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={chart.points.map(({ x, y }) => `${x},${y}`).join(' ')}
              fill="none"
              stroke="var(--acc)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {chart.points.map((point, index) => (
            <span key={`${point.day}-${index}`}>
              <span
                className={cx(styles.point, index === last && styles.last)}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              />
              <span
                className={cx(
                  styles.label,
                  index === 0 && styles.labelFirst,
                  index === last && styles.labelLast,
                )}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                {formatRm(point)}
              </span>
            </span>
          ))}
        </div>
        <div className={styles.ends} aria-hidden="true">
          <span>{formatShortDay(chart.points[0].day, today)}</span>
          <span>{formatShortDay(chart.points[last].day, today)}</span>
        </div>
      </div>
    );
  } else if (points.length === 1) {
    body = (
      <div className={styles.single}>
        <span className={styles.value}>{formatRm(points[0])}</span>
        <span className={styles.when}>{formatDayWithYear(points[0].day)}</span>
      </div>
    );
  } else {
    body = (
      <div className={styles.empty}>
        Todavía no tiene RMs de este ejercicio.
      </div>
    );
  }

  return (
    <HistoryChartCard
      titleId="historial-rm"
      title="Progresión del RM"
      subtitle={subtitle}
      aside={
        chart && (
          <Pill tone={chart.delta >= 0 ? 'ok' : 'mut'} className={styles.delta}>
            {chart.delta >= 0 ? '+' : '−'}
            {formatWeight(Math.abs(chart.delta))}
          </Pill>
        )
      }
    >
      {body}
      <p className={styles.footer}>
        Sale de los RMs que registró el alumno. Las series del historial son las
        prescriptas: no dicen cuánto levantó.
      </p>
    </HistoryChartCard>
  );
}
