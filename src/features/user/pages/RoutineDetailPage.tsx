import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  Note,
  PageHeader,
  Stat,
  StatGrid,
} from '@/shared/ui';

import { RoutineCircuit } from '../components/RoutineCircuit';
import { homeBackTo } from '../homeState';
import {
  useIndividualRoutine,
  usePlanRoutine,
} from '../hooks/useRoutineDetail';
import {
  individualView,
  planSessionView,
  routineStats,
  type RoutineView,
} from '../routineDetail';
import styles from './RoutineDetailPage.module.css';

/** Lo que la pantalla necesita de la consulta, sea de la vía individual o de la del plan. */
interface RoutineQuery {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isRefetching: boolean;
  refetch: () => unknown;
}

/**
 * Detalle de una rutina del Usuario (CU-U-09): sus circuitos en orden, con los ejercicios y sus series,
 * y lo que el alumno ya hizo. Se abre desde una asignación, así que hay dos rutas con la misma pantalla:
 * `/u/rutina/:id` (una rutina individual) y `/u/rutina/plan/:userPlanificationId/:routineAsignationId`
 * (una rutina de una semana del plan). "Volver" deja el home en la semana de la que vino.
 */
export function RoutineDetailPage() {
  const { id, userPlanificationId, routineAsignationId } = useParams();
  if (id) return <IndividualRoutine assignmentId={id} />;
  if (userPlanificationId && routineAsignationId) {
    return (
      <PlanRoutine
        userPlanificationId={userPlanificationId}
        routineAsignationId={routineAsignationId}
      />
    );
  }
  // Las dos rutas traen alguno de los dos pares de ids.
  return null;
}

function IndividualRoutine({ assignmentId }: { assignmentId: string }) {
  const query = useIndividualRoutine(assignmentId);
  const view = useMemo(
    () => (query.data ? individualView(query.data) : undefined),
    [query.data],
  );
  return <RoutineScreen query={query} view={view} />;
}

function PlanRoutine({
  userPlanificationId,
  routineAsignationId,
}: {
  userPlanificationId: string;
  routineAsignationId: string;
}) {
  const query = usePlanRoutine(userPlanificationId, routineAsignationId);
  const view = useMemo(
    () => (query.data ? planSessionView(query.data) : undefined),
    [query.data],
  );
  return <RoutineScreen query={query} view={view} />;
}

/** El error de una rutina que no se puede abrir: 403 y 404 son definitivos, no se reintentan. */
function RoutineError({ query }: { query: RoutineQuery }) {
  const { error } = query;
  if (isApiError(error) && error.status === 403) {
    return (
      <ErrorState
        title="Esta rutina no es tuya"
        message="Solo podés ver las rutinas que te asignaron a vos."
      />
    );
  }
  if (isApiError(error) && (error.status === 404 || error.status === 400)) {
    // El backend distingue la rutina que el entrenador quitó del plan sin que el alumno hiciera nada.
    const removed = error.serverMessage?.includes('quitada') ?? false;
    return (
      <ErrorState
        title="No encontramos la rutina"
        message={
          removed
            ? 'Tu entrenador la quitó del plan y no hiciste nada en ella.'
            : 'Puede que tu entrenador la haya cambiado. Volvé al inicio y buscala de nuevo.'
        }
      />
    );
  }
  return (
    <ErrorState
      message={getErrorMessage(error)}
      onRetry={() => void query.refetch()}
      retrying={query.isRefetching}
    />
  );
}

function RoutineScreen({
  query,
  view,
}: {
  query: RoutineQuery;
  view: RoutineView | undefined;
}) {
  const { state } = useLocation();

  let content;
  if (query.isError) {
    content = <RoutineError query={query} />;
  } else if (!view) {
    content = <ListSkeleton columns={2} rows={4} />;
  } else {
    content = <RoutineBody view={view} />;
  }

  return (
    <>
      <PageHeader
        eyebrow={view?.eyebrow ?? 'Rutina'}
        title={view?.routine.name ?? 'Rutina'}
        back={homeBackTo(state)}
      />
      {content}
    </>
  );
}

function RoutineBody({ view }: { view: RoutineView }) {
  const { routine, finished, notices, planNote } = view;
  const stats = routineStats(view);
  const circuits = [...routine.circuits].sort((a, b) => a.order - b.order);

  return (
    <>
      <StatGrid className={styles.stats}>
        <Stat value={stats.exercises} label="ejercicios" />
        <Stat value={stats.sets} label="series" />
        <Stat
          value={`${stats.done}/${stats.exercises}`}
          label="hechos"
          tone={
            stats.exercises > 0 && stats.done === stats.exercises
              ? 'ok'
              : undefined
          }
        />
      </StatGrid>
      {notices.map((notice) => (
        <Note
          key={notice.text}
          tone={notice.tone}
          icon={notice.tone === 'warn' ? 'alert' : 'note'}
        >
          {notice.text}
        </Note>
      ))}
      {planNote && (
        <Note tone="acc" icon="note">
          <b>Nota del plan:</b> {planNote}
        </Note>
      )}
      {routine.coach_note && (
        <Note tone="acc" icon="note">
          <b>Nota de tu entrenador:</b> {routine.coach_note}
        </Note>
      )}
      {circuits.length === 0 ? (
        <EmptyState
          icon="dumbbell"
          title="Todavía no hay ejercicios"
          message="Tu entrenador no cargó ejercicios en esta rutina."
        />
      ) : (
        circuits.map((link) => (
          <RoutineCircuit key={link.id} link={link} finished={finished} />
        ))
      )}
    </>
  );
}
