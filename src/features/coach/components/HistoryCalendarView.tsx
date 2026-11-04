import { useMemo, useState } from 'react';

import type { RoutineHistorySession } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import {
  activityByDay,
  currentStreak,
  defaultCalendarDay,
  formatDayAndMonth,
  formatLongDay,
  monthCalendar,
  monthTitle,
  plural,
  sessionId,
  type CalendarDay,
  type Day,
  type Month,
} from '@/shared/lib/trainingHistory';

import styles from './HistoryCalendarView.module.css';
import { HistoryChartCard } from './HistoryChartCard';
import { HistoryColumns } from './HistoryColumns';
import { HistoryDayCard } from './HistoryDayCard';
import legend from './HistoryLegend.module.css';
import { HistoryMonthArrows } from './HistoryMonthArrows';
import { HistoryStats } from './HistoryStats';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const LEVELS = [legend.level0, legend.level1, legend.level2, legend.level3];

interface HistoryCalendarViewProps {
  sessions: readonly RoutineHistorySession[];
  month: Month;
  canGoBack: boolean;
  canGoForward: boolean;
  onMove: (step: -1 | 1) => void;
  onOpenExercise: (exerciseId: string) => void;
  today: Day;
}

/** El texto alternativo de un día (spec 11): «4 de noviembre, hoy: 2 sesiones, 5 ejercicios». */
function dayLabel(day: CalendarDay): string {
  const done =
    day.exercises > 0
      ? `${plural(day.sessions, 'sesión', 'sesiones')}, ${plural(day.exercises, 'ejercicio', 'ejercicios')}`
      : 'sin entrenamientos';
  return `${formatDayAndMonth(day.day)}${day.today ? ', hoy' : ''}: ${done}`;
}

/**
 * La pestaña Calendario (sección 7): el resumen del mes, los días con su intensidad (los ejercicios hechos
 * ese día, D55) y lo que hizo el día elegido. El día elegido no va en la URL: al cambiar de mes o al
 * volver del detalle de un ejercicio, es el de por defecto (7.3).
 */
export function HistoryCalendarView({
  sessions,
  month,
  canGoBack,
  canGoForward,
  onMove,
  onOpenExercise,
  today,
}: HistoryCalendarViewProps) {
  const activity = useMemo(() => activityByDay(sessions), [sessions]);
  const calendar = monthCalendar(activity, month, today);
  // El día que se tocó es del mes en que se tocó: en otro mes vuelve el de por defecto.
  const [picked, setPicked] = useState<{ month: Month; day: Day } | null>(null);
  const selected =
    picked?.month === month
      ? picked.day
      : defaultCalendarDay(month, today, calendar);
  const done = selected ? activity.get(selected) : undefined;

  let body;
  if (selected === null) {
    body = (
      <div className={styles.empty}>En este mes no hay entrenamientos.</div>
    );
  } else if (!done) {
    body = <div className={styles.empty}>Sin entrenamientos ese día.</div>;
  } else {
    body = (
      <div className={styles.cards}>
        {done.sessions.map((session) => (
          <HistoryDayCard
            key={sessionId(session)}
            session={session}
            day={selected}
            today={today}
            onOpenExercise={onOpenExercise}
          />
        ))}
      </div>
    );
  }

  return (
    <HistoryColumns
      left={
        <>
          <HistoryStats
            stats={[
              {
                value: calendar.trainedDays,
                label:
                  calendar.trainedDays === 1
                    ? 'Día entrenado'
                    : 'Días entrenados',
              },
              {
                value: calendar.sessions,
                label: calendar.sessions === 1 ? 'Sesión' : 'Sesiones',
              },
              {
                value: `${currentStreak(sessions, today)} sem`,
                label: 'Racha actual',
              },
            ]}
          />
          <HistoryChartCard
            titleId="historial-calendario"
            title={monthTitle(month)}
            subtitle="Días en que hizo ejercicios"
            large
            live
            aside={
              <HistoryMonthArrows
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onMove={onMove}
              />
            }
          >
            <div className={styles.grid}>
              {WEEKDAYS.map((weekday, index) => (
                <span key={index} className={styles.weekday} aria-hidden="true">
                  {weekday}
                </span>
              ))}
              {Array.from({ length: calendar.leading }, (_, index) => (
                <span key={`hueco-${index}`} aria-hidden="true" />
              ))}
              {calendar.days.map((day) => (
                <button
                  key={day.day}
                  type="button"
                  className={cx(
                    styles.day,
                    styles[`level${day.level}`],
                    day.today && styles.today,
                    day.day === selected && styles.selected,
                  )}
                  disabled={day.future}
                  aria-pressed={day.day === selected}
                  aria-label={dayLabel(day)}
                  onClick={() => setPicked({ month, day: day.day })}
                >
                  {day.date}
                </button>
              ))}
            </div>
            <div className={cx(legend.legend, styles.legend)}>
              <span className={legend.heat}>
                Menos
                {LEVELS.map((level, index) => (
                  <i key={index} className={level} />
                ))}
                Más
              </span>
            </div>
          </HistoryChartCard>
        </>
      }
      right={
        <section aria-labelledby="historial-dia">
          <h2 id="historial-dia" className={styles.title}>
            {selected ? formatLongDay(selected) : 'Tocá un día'}
          </h2>
          {done && (
            <div className={styles.subtitle}>
              {plural(done.sessions.length, 'sesión', 'sesiones')} ·{' '}
              {plural(done.exercises, 'ejercicio hecho', 'ejercicios hechos')}
            </div>
          )}
          {body}
        </section>
      }
    />
  );
}
