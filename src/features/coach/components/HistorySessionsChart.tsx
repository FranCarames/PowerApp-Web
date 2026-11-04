import type { RoutineHistorySession } from '@/api/types';
import {
  formatOneDecimal,
  monthName,
  monthOf,
  monthSessionBars,
  plural,
  weekLabel,
  type Day,
  type Month,
  type SessionBar,
} from '@/shared/lib/trainingHistory';

import { HistoryChartCard } from './HistoryChartCard';
import styles from './HistoryLegend.module.css';
import { HistoryMonthArrows } from './HistoryMonthArrows';
import { HistoryWeekBars } from './HistoryWeekBars';

interface HistorySessionsChartProps {
  sessions: readonly RoutineHistorySession[];
  month: Month;
  canGoBack: boolean;
  canGoForward: boolean;
  onMove: (step: -1 | 1) => void;
  /** La semana resaltada desde una barra, o `null`. */
  highlightedWeek: Day | null;
  onSelectWeek: (monday: Day) => void;
  today: Day;
}

/** El texto alternativo de una barra (spec 11). */
function barLabel(bar: SessionBar, today: Day): string {
  const week = weekLabel(bar.monday, today);
  if (bar.future) return `${week}: todavía no llegó.`;
  const detail =
    bar.total > 0
      ? `, ${bar.plan} del plan y ${plural(bar.individual, 'individual', 'individuales')}`
      : '';
  return `${week}: ${plural(bar.total, 'sesión', 'sesiones')}${detail}.${bar.selectable ? ' Ver en la lista.' : ''}`;
}

/**
 * «Sesiones de <mes>» (6.2): una barra por semana completa que toca el mes, con las del plan (violeta,
 * abajo) y las individuales (naranja, arriba). Tocar una barra lleva a esa semana en la lista.
 */
export function HistorySessionsChart({
  sessions,
  month,
  canGoBack,
  canGoForward,
  onMove,
  highlightedWeek,
  onSelectWeek,
  today,
}: HistorySessionsChartProps) {
  const data = monthSessionBars(sessions, month, today);
  const subtitle = `${plural(data.sessions, 'sesión', 'sesiones')} en ${plural(data.startedWeeks, 'semana', 'semanas')}${
    month === monthOf(today)
      ? ', hasta hoy'
      : ` · ${formatOneDecimal(data.startedWeeks > 0 ? data.sessions / data.startedWeeks : 0)} por semana`
  }`;

  return (
    <HistoryChartCard
      titleId="historial-sesiones-mes"
      title={`Sesiones de ${monthName(month)}`}
      subtitle={subtitle}
      live
      aside={
        <HistoryMonthArrows
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onMove={onMove}
        />
      }
    >
      <HistoryWeekBars
        interactive
        scale={data.scale}
        items={data.bars.map((bar) => ({
          ...bar,
          segments: [
            { value: bar.individual, tone: 'individual' },
            { value: bar.plan, tone: 'plan' },
          ],
          label: barLabel(bar, today),
          highlighted: highlightedWeek === bar.monday,
          onSelect: bar.selectable ? () => onSelectWeek(bar.monday) : undefined,
        }))}
      />
      <div className={styles.legend}>
        <span>
          <i className={styles.plan} />
          Plan
        </span>
        <span>
          <i className={styles.individual} />
          Individual
        </span>
        <span className={styles.end}>
          <i className={styles.current} />
          Esta semana
        </span>
      </div>
    </HistoryChartCard>
  );
}
