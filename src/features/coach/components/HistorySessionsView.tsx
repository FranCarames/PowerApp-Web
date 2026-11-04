import { useEffect, useRef, useState } from 'react';

import type { RoutineHistorySession } from '@/api/types';
import {
  formatRelativeDay,
  historySummary,
  historyWeeks,
  type Day,
  type ExerciseTimes,
  type Month,
} from '@/shared/lib/trainingHistory';

import { weekHeadingId } from '../history';
import { HistoryColumns } from './HistoryColumns';
import { HistoryExerciseFilter } from './HistoryExerciseFilter';
import { HistorySessionsChart } from './HistorySessionsChart';
import { HistoryStats } from './HistoryStats';
import { HistoryWeekList } from './HistoryWeekList';

/** Cuántas semanas suma «Ver semanas anteriores» (y cuántas se ven al entrar). */
const WEEKS_PER_PAGE = 4;

interface HistorySessionsViewProps {
  sessions: readonly RoutineHistorySession[];
  done: readonly ExerciseTimes[];
  month: Month;
  canGoBack: boolean;
  canGoForward: boolean;
  onMove: (step: -1 | 1) => void;
  onOpenExercise: (exerciseId: string | null) => void;
  today: Day;
}

/**
 * La pestaña Sesiones (sección 6): a la izquierda, el resumen, el gráfico del mes y el filtro; a la
 * derecha, el aviso y la lista por semana. Tocar una barra abre la lista hasta esa semana, baja hasta su
 * título, le da el foco y la resalta hasta que se toque otra o se cambie de mes.
 */
export function HistorySessionsView({
  sessions,
  done,
  month,
  canGoBack,
  canGoForward,
  onMove,
  onOpenExercise,
  today,
}: HistorySessionsViewProps) {
  const [visibleWeeks, setVisibleWeeks] = useState(WEEKS_PER_PAGE);
  // La semana resaltada es del mes en que se tocó: al cambiar de mes deja de estarlo.
  const [highlight, setHighlight] = useState<{
    month: Month;
    monday: Day;
  } | null>(null);
  const highlightedWeek = highlight?.month === month ? highlight.monday : null;
  // La semana hasta la que hay que bajar cuando la lista ya se abrió hasta ella.
  const scrollTarget = useRef<Day | null>(null);

  const summary = historySummary(sessions, today);
  const weeks = historyWeeks(sessions, today);

  useEffect(() => {
    const target = scrollTarget.current;
    if (target === null) return;
    scrollTarget.current = null;
    const heading = document.getElementById(weekHeadingId(target));
    if (!heading) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    heading.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
    heading.focus({ preventScroll: true });
  });

  function selectWeek(monday: Day) {
    const index = weeks.findIndex((week) => week.monday === monday);
    if (index >= visibleWeeks) {
      setVisibleWeeks(Math.ceil((index + 1) / WEEKS_PER_PAGE) * WEEKS_PER_PAGE);
    }
    setHighlight({ month, monday });
    scrollTarget.current = monday;
  }

  return (
    <HistoryColumns
      left={
        <>
          <HistoryStats
            stats={[
              { value: summary.total, label: 'Sesiones' },
              {
                value: summary.last
                  ? formatRelativeDay(summary.last, today)
                  : '—',
                label: 'Última',
              },
              { value: summary.thisWeek, label: 'Esta semana' },
            ]}
          />
          <HistorySessionsChart
            sessions={sessions}
            month={month}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onMove={onMove}
            highlightedWeek={highlightedWeek}
            onSelectWeek={selectWeek}
            today={today}
          />
          <HistoryExerciseFilter
            done={done}
            selected={null}
            onSelect={onOpenExercise}
          />
        </>
      }
      right={
        <HistoryWeekList
          weeks={weeks}
          visibleWeeks={visibleWeeks}
          onShowMore={() => setVisibleWeeks(visibleWeeks + WEEKS_PER_PAGE)}
          highlightedWeek={highlightedWeek}
          today={today}
          onOpenExercise={onOpenExercise}
        />
      }
    />
  );
}
