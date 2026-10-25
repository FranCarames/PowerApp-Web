import { useMemo, useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { RoutineHistorySession } from '@/api/types';
import { useExercises } from '@/features/catalog/hooks/useExercises';
import { exercisesInHistory, sessionKey } from '@/shared/lib/trainingHistory';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  Note,
  Select,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { useTrainingHistory } from '../hooks/useTrainingHistory';
import { HistorySessionCard } from './HistorySessionCard';
import styles from './StudentHistoryModal.module.css';

/** Cuántas sesiones se muestran de una vez: el backend no pagina y un alumno con meses de historia tiene decenas. */
const PAGE_SIZE = 10;

const NOT_FOUND =
  'No encontramos al alumno. Volvé a la lista y probá de nuevo.';

function HistorySkeleton() {
  return (
    <div aria-busy="true">
      <VisuallyHidden role="status">Cargando el historial…</VisuallyHidden>
      <Skeleton height={132} radius={16} />
      <Skeleton height={132} radius={16} />
    </div>
  );
}

/** Las sesiones, de a `PAGE_SIZE`. Se vuelve a montar al cambiar el filtro, así que arranca de nuevo en la primera página. */
function SessionList({
  sessions,
}: {
  sessions: readonly RoutineHistorySession[];
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = sessions.slice(0, limit);
  const remaining = sessions.length - visible.length;

  return (
    <>
      <ul className={styles.sessions}>
        {visible.map((session, index) => (
          <li key={sessionKey(session, index)}>
            <HistorySessionCard session={session} />
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <Button
          variant="sec"
          className={styles.more}
          onClick={() => setLimit(limit + PAGE_SIZE)}
        >
          Ver más sesiones ({remaining}{' '}
          {remaining === 1 ? 'restante' : 'restantes'})
        </Button>
      )}
    </>
  );
}

/**
 * El contenido del modal. Vive adentro para que se monte al abrirlo: así las queries solo corren con el
 * modal abierto y el filtro vuelve a "Todos" cada vez.
 */
function HistoryContent({ studentId }: { studentId: string }) {
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  // La lista completa: es la que se ve sin filtro y de la que sale "lo que hizo el alumno" del selector.
  const everything = useTrainingHistory(studentId);
  // Con un ejercicio elegido pide solo ese (CU-E-07); sin filtro es la misma query y no pide dos veces.
  const shown = useTrainingHistory(studentId, exerciseId);
  const catalog = useExercises();

  const done = useMemo(
    () => (everything.data ? exercisesInHistory(everything.data) : []),
    [everything.data],
  );
  // El resto del catálogo, para consultar un ejercicio que el alumno no hizo (sin registros, CU-E-07).
  const others = useMemo(() => {
    const doneIds = new Set(done.map(({ id }) => id));
    return (catalog.data ?? [])
      .filter(({ id }) => !doneIds.has(id))
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [catalog.data, done]);

  if (everything.isError) {
    return (
      <ErrorState
        message={getErrorMessage(everything.error, { 404: NOT_FOUND })}
        onRetry={() => void everything.refetch()}
        retrying={everything.isRefetching}
      />
    );
  }
  if (everything.isPending) return <HistorySkeleton />;
  if (everything.data.length === 0) {
    return (
      <EmptyState
        icon="list"
        title="Todavía no registra entrenamientos"
        message="Cuando el alumno marque ejercicios como hechos, sus sesiones van a aparecer acá."
      />
    );
  }

  const exerciseName = [...done, ...others].find(
    ({ id }) => id === exerciseId,
  )?.name;

  let list;
  if (shown.isError) {
    list = (
      <ErrorState
        message={getErrorMessage(shown.error, { 404: NOT_FOUND })}
        onRetry={() => void shown.refetch()}
        retrying={shown.isRefetching}
      />
    );
  } else if (shown.isPending) {
    list = <HistorySkeleton />;
  } else if (shown.data.length === 0) {
    list = (
      <EmptyState
        icon="list"
        title="Sin registros para este ejercicio"
        message={
          <>
            El alumno no hizo <b>{exerciseName ?? 'ese ejercicio'}</b> en
            ninguna sesión.
          </>
        }
      />
    );
  } else {
    list = <SessionList key={exerciseId ?? 'all'} sessions={shown.data} />;
  }

  return (
    <>
      <Note tone="acc" icon="note">
        Las series son las que prescribió el entrenador en la rutina, tal como
        está hoy: la app no registra el peso ni las repeticiones que hizo el
        alumno.
      </Note>
      <Field label="Filtrar por ejercicio">
        <Select
          value={exerciseId ?? ''}
          onChange={(event) => setExerciseId(event.target.value || null)}
        >
          <option value="">Todos los ejercicios</option>
          <optgroup label="Los que hizo el alumno">
            {done.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </optgroup>
          {others.length > 0 && (
            <optgroup label="Otros del catálogo">
              {others.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
      </Field>
      {list}
    </>
  );
}

interface StudentHistoryModalProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onClose: () => void;
}

/**
 * El historial de entrenamientos de un alumno (CU-E-06), en un modal: las sesiones donde marcó al menos un
 * ejercicio como hecho, de la más reciente a la más antigua, con el filtro por ejercicio (CU-E-07). Es de
 * solo lectura. Muestra las sesiones en el orden que manda el backend.
 */
export function StudentHistoryModal({
  studentId,
  studentName,
  open,
  onClose,
}: StudentHistoryModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Historial de entrenamientos"
      description={
        <>
          Sesiones de <b>{studentName}</b>, de la más reciente a la más antigua.
        </>
      }
      actions={
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <HistoryContent studentId={studentId} />
    </Modal>
  );
}
