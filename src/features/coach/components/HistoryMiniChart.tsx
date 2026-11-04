import type { RoutineHistorySession } from '@/api/types';
import { recentWeeks, type Day } from '@/shared/lib/trainingHistory';

import styles from './HistoryMiniChart.module.css';

/**
 * El mini gráfico de la fila de la ficha (spec 4): 8 barras finas, una por semana completa, de la de
 * hace 7 semanas a la actual, con las del plan (violeta, abajo) y las individuales (naranja, arriba).
 * Es decorativo: lo que importa lo dice el subtítulo.
 */
export function HistoryMiniChart({
  sessions,
  today,
}: {
  sessions: readonly RoutineHistorySession[];
  today: Day;
}) {
  const { weeks, scale } = recentWeeks(sessions, today);
  return (
    <span className={styles.mini} aria-hidden="true">
      {weeks.map(({ plan, individual }, index) => (
        <span key={index} className={styles.week}>
          <i
            className={styles.individual}
            style={{ height: `${(individual / scale) * 100}%` }}
          />
          <i
            className={styles.plan}
            style={{ height: `${(plan / scale) * 100}%` }}
          />
        </span>
      ))}
    </span>
  );
}
