import {
  monthName,
  monthOf,
  monthTimesBars,
  plural,
  weekLabel,
  type Day,
  type ExerciseOccurrence,
  type Month,
} from '@/shared/lib/trainingHistory';

import { HistoryChartCard } from './HistoryChartCard';
import { HistoryMonthArrows } from './HistoryMonthArrows';
import { HistoryWeekBars } from './HistoryWeekBars';

interface HistoryTimesChartProps {
  occurrences: readonly ExerciseOccurrence[];
  month: Month;
  canGoBack: boolean;
  canGoForward: boolean;
  onMove: (step: -1 | 1) => void;
  today: Day;
}

/**
 * «Veces en <mes>» (8.4): una barra verde por semana del mes con las veces que hizo el ejercicio, por el
 * día en que lo hizo. Las mismas semanas y el mismo `?mes` que «Sesiones de …»; estas barras no se tocan.
 */
export function HistoryTimesChart({
  occurrences,
  month,
  canGoBack,
  canGoForward,
  onMove,
  today,
}: HistoryTimesChartProps) {
  const data = monthTimesBars(occurrences, month, today);

  return (
    <HistoryChartCard
      titleId="historial-veces-mes"
      title={`Veces en ${monthName(month)}`}
      subtitle={`${plural(data.times, 'vez', 'veces')} en estas semanas${month === monthOf(today) ? ', hasta hoy' : ''}`}
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
        interactive={false}
        compact
        scale={data.scale}
        items={data.bars.map((bar) => ({
          ...bar,
          total: bar.times,
          segments: [{ value: bar.times, tone: 'ok' }],
          label: `${weekLabel(bar.monday, today)}: ${bar.future ? 'todavía no llegó' : plural(bar.times, 'vez', 'veces')}`,
        }))}
      />
    </HistoryChartCard>
  );
}
