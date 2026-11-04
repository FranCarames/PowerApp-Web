import { useMemo, useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import { useUserRms } from '@/features/account/hooks/useUserRms';
import {
  exerciseNotes,
  exerciseOccurrences,
  formatRelativeDay,
  formatShortDay,
  plural,
  rmProgression,
  sessionId,
  sessionOrigin,
  toDay,
  type Day,
  type ExerciseTimes,
  type Month,
} from '@/shared/lib/trainingHistory';
import { formatWeight } from '@/shared/lib/format';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { useTrainingHistory } from '../hooks/useTrainingHistory';
import { HistoryColumns } from './HistoryColumns';
import { HistoryDayBadge } from './HistoryDayBadge';
import { HistoryExerciseFilter } from './HistoryExerciseFilter';
import styles from './HistoryExerciseView.module.css';
import { HistoryNote } from './HistoryNote';
import { HistoryPrescription } from './HistoryPrescription';
import { HistoryStats } from './HistoryStats';
import { HistoryTimesChart } from './HistoryTimesChart';
import { RmProgressionCard } from './RmProgressionCard';
import { SessionSourcePill } from './SessionSourcePill';

/** Cuántas sesiones se ven de entrada, y cuántas suma «Ver más sesiones» (8.7). */
const SESSIONS_PER_PAGE = 6;

interface HistoryExerciseViewProps {
  studentId: string;
  exercise: { id: string; name: string };
  done: readonly ExerciseTimes[];
  month: Month;
  canGoBack: boolean;
  canGoForward: boolean;
  onMove: (step: -1 | 1) => void;
  onSelectExercise: (exerciseId: string | null) => void;
  today: Day;
}

/**
 * El detalle de un ejercicio (sección 8, CU-E-07): los números, la progresión del RM, las veces por semana
 * del mes, el filtro, las notas y las sesiones en las que lo hizo. Pide el historial con `exercise_id` y
 * los RMs del alumno.
 */
export function HistoryExerciseView({
  studentId,
  exercise,
  done,
  month,
  canGoBack,
  canGoForward,
  onMove,
  onSelectExercise,
  today,
}: HistoryExerciseViewProps) {
  const filtered = useTrainingHistory(studentId, exercise.id);
  const rms = useUserRms(studentId);
  const [visible, setVisible] = useState(SESSIONS_PER_PAGE);

  const occurrences = useMemo(
    () =>
      filtered.data ? exerciseOccurrences(filtered.data, exercise.id) : [],
    [filtered.data, exercise.id],
  );
  const points = useMemo(
    () => (rms.data ? rmProgression(rms.data, exercise.id) : undefined),
    [rms.data, exercise.id],
  );

  if (filtered.isError) {
    return (
      <ErrorState
        message={getErrorMessage(filtered.error)}
        onRetry={() => void filtered.refetch()}
        retrying={filtered.isRefetching}
      />
    );
  }
  if (filtered.isPending) {
    return (
      <div aria-busy="true" className={styles.loading}>
        <VisuallyHidden role="status">Cargando el ejercicio…</VisuallyHidden>
        <Skeleton height={72} radius={14} />
        <Skeleton height={220} radius={16} />
      </div>
    );
  }

  const current = points?.at(-1);
  const notes = exerciseNotes(occurrences);
  const shown = occurrences.slice(0, visible);
  const remaining = occurrences.length - shown.length;

  const left = (
    <>
      <HistoryStats
        stats={[
          {
            value: occurrences.length,
            label: occurrences.length === 1 ? 'Vez' : 'Veces',
          },
          {
            value: occurrences[0]
              ? formatRelativeDay(occurrences[0].day, today)
              : '—',
            label: 'Última vez',
          },
          {
            value: current ? formatWeight(current.weight) : '—',
            label: 'RM actual',
          },
        ]}
      />
      <RmProgressionCard
        exerciseName={exercise.name}
        points={points}
        error={rms.error}
        onRetry={() => void rms.refetch()}
        retrying={rms.isRefetching}
        today={today}
      />
      {occurrences.length > 0 && (
        <HistoryTimesChart
          occurrences={occurrences}
          month={month}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onMove={onMove}
          today={today}
        />
      )}
      <HistoryExerciseFilter
        done={done}
        selected={exercise}
        onSelect={onSelectExercise}
      />
    </>
  );

  if (occurrences.length === 0) {
    return (
      <HistoryColumns
        left={left}
        right={
          <EmptyState
            title="Sin registros para este ejercicio"
            message={
              <>
                El alumno no hizo{' '}
                <b className={styles.strong}>{exercise.name}</b> en ninguna
                sesión.
              </>
            }
          />
        }
      />
    );
  }

  return (
    <HistoryColumns
      left={left}
      right={
        <>
          {notes.length > 0 && (
            <section aria-labelledby="historial-notas" className={styles.block}>
              <div className={styles.head}>
                <h2 id="historial-notas" className={styles.title}>
                  Notas del alumno
                </h2>
                <span className={styles.count}>{notes.length}</span>
              </div>
              <div className={styles.list}>
                {notes.map((note) => (
                  <Card key={note.key} className={styles.noteCard}>
                    <figure>
                      <blockquote className={styles.quote}>
                        «{note.note}»
                      </blockquote>
                      <figcaption className={styles.caption}>
                        {formatShortDay(note.day, today)} · {note.routine}
                      </figcaption>
                    </figure>
                  </Card>
                ))}
              </div>
            </section>
          )}
          <section aria-labelledby="historial-sesiones">
            <div className={styles.head}>
              <h2 id="historial-sesiones" className={styles.title}>
                Sesiones
              </h2>
              <span className={styles.count}>
                {plural(occurrences.length, 'sesión', 'sesiones')}
              </span>
            </div>
            <div className={styles.list}>
              {shown.map(({ session, entries, day }) => (
                <Card key={sessionId(session)} className={styles.session}>
                  <HistoryDayBadge day={day} />
                  <div className={styles.body}>
                    <div className={styles.sessionHead}>
                      <div className={styles.info}>
                        <h3 className={styles.routine}>
                          {session.routine.name}
                        </h3>
                        <div className={styles.sub}>
                          {sessionOrigin(session)}
                        </div>
                      </div>
                      <SessionSourcePill session={session} />
                    </div>
                    {entries.map((entry) => (
                      <div
                        key={entry.routine_exercise_id}
                        className={styles.entry}
                      >
                        <div className={styles.entryRow}>
                          <span className={styles.entryLabel}>
                            {entries.length > 1
                              ? `Hecho el ${formatShortDay(toDay(entry.finished_at), today)}`
                              : 'Prescripto'}
                          </span>
                          <HistoryPrescription sets={entry.sets} />
                        </div>
                        {entry.user_note?.trim() && (
                          <HistoryNote note={entry.user_note.trim()} />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            {remaining > 0 && (
              <Button
                variant="ghost"
                className={styles.more}
                onClick={() => setVisible(visible + SESSIONS_PER_PAGE)}
              >
                Ver más sesiones ({remaining})
              </Button>
            )}
          </section>
        </>
      }
    />
  );
}
