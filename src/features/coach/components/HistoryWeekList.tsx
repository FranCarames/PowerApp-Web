import { useState } from 'react';

import type { RoutineHistorySession } from '@/api/types';
import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';
import {
  plural,
  sessionId,
  weekTitle,
  type Day,
  type HistoryWeek,
} from '@/shared/lib/trainingHistory';
import { Button, Note } from '@/shared/ui';

import { weekHeadingId } from '../history';
import { HistorySessionCard } from './HistorySessionCard';
import styles from './HistoryWeekList.module.css';

interface HistoryWeekListProps {
  weeks: readonly HistoryWeek[];
  /** Cuántas semanas se ven, de la más nueva hacia atrás. */
  visibleWeeks: number;
  onShowMore: () => void;
  /** La semana resaltada desde el gráfico, o `null`. */
  highlightedWeek: Day | null;
  today: Day;
  onOpenExercise: (exerciseId: string) => void;
}

/**
 * El aviso y la lista agrupada por semana completa (6.4). La primera sesión (la más nueva) viene abierta y
 * las demás, cerradas; lo que se abre o se cierra no va en la URL.
 */
export function HistoryWeekList({
  weeks,
  visibleWeeks,
  onShowMore,
  highlightedWeek,
  today,
  onOpenExercise,
}: HistoryWeekListProps) {
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const first = weeks.flatMap(({ sessions }) => sessions)[0];
  const firstId = first ? sessionId(first) : null;
  const isOpen = (session: RoutineHistorySession) => {
    const id = sessionId(session);
    return toggled[id] ?? id === firstId;
  };

  return (
    <>
      <Note tone="acc" icon="note">
        Las series son las que prescribió el entrenador en la rutina, tal como
        está hoy: la app no registra el peso ni las repeticiones que hizo el
        alumno.
      </Note>
      {weeks.slice(0, visibleWeeks).map(({ monday, sessions }) => (
        <section
          key={monday}
          aria-labelledby={weekHeadingId(monday)}
          className={cx(
            styles.week,
            highlightedWeek === monday && styles.highlighted,
          )}
        >
          <div className={styles.head}>
            <h3
              id={weekHeadingId(monday)}
              tabIndex={-1}
              className={styles.title}
            >
              {weekTitle(monday, today)}
            </h3>
            {sessions.length > 0 && (
              <span className={styles.count}>
                {plural(sessions.length, 'sesión', 'sesiones')}
              </span>
            )}
          </div>
          {sessions.length > 0 ? (
            <div className={styles.sessions}>
              {sessions.map((session) => (
                <HistorySessionCard
                  key={sessionId(session)}
                  session={session}
                  open={isOpen(session)}
                  onToggle={() =>
                    setToggled({
                      ...toggled,
                      [sessionId(session)]: !isOpen(session),
                    })
                  }
                  today={today}
                  onOpenExercise={onOpenExercise}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>Sin entrenamientos esta semana.</div>
          )}
        </section>
      ))}
      {visibleWeeks < weeks.length && (
        <Button variant="ghost" onClick={onShowMore}>
          Ver semanas anteriores
          <Icon name="chevD" size={16} />
        </Button>
      )}
    </>
  );
}
