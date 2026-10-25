import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router';

import {
  EmptyState,
  ListSkeleton,
  Note,
  PageHeader,
  Stat,
  StatGrid,
} from '@/shared/ui';

import {
  RoutineLoadError,
  type RoutineQuery,
} from '../components/RoutineLoadError';
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
  sortCircuitLinks,
  type RoutineView,
} from '../routineDetail';
import styles from './RoutineDetailPage.module.css';

/**
 * Detalle de una rutina del Usuario (CU-U-09): sus circuitos en orden, con los ejercicios y sus series,
 * y lo que el alumno ya hizo. Se abre desde una asignación, así que hay dos rutas con la misma pantalla:
 * `/u/rutina/:id` (una rutina individual) y `/u/rutina/plan/:userPlanificationId/:routineAsignationId`
 * (una rutina de una semana del plan). "Volver" deja el home en la semana de la que vino. Cada
 * ejercicio abre su detalle (CU-U-10).
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
    content = <RoutineLoadError query={query} />;
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
  const { routine, finished, notices, planNote, assignment } = view;
  const stats = routineStats(view);
  const circuits = sortCircuitLinks(routine.circuits);

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
          <RoutineCircuit
            key={link.id}
            link={link}
            assignment={assignment}
            finished={finished}
          />
        ))
      )}
    </>
  );
}
