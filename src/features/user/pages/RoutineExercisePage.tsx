import { useMemo, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import { useUserRms } from '@/features/account/hooks/useUserRms';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useExercise } from '@/features/catalog/hooks/useExercises';
import { cx } from '@/shared/lib/cx';
import { formatDate } from '@/shared/lib/dates';
import { formatDecimal } from '@/shared/lib/format';
import { rmsOfExercise } from '@/shared/lib/rms';
import { expandSetBlocks } from '@/shared/lib/sets';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LinkButton,
  Note,
  PageHeader,
  SectionHeader,
  Columns,
} from '@/shared/ui';

import { ExerciseDetails, ExerciseHero } from '../components/ExerciseSheet';
import { ExerciseLog } from '../components/ExerciseLog';
import { ExerciseRms } from '../components/ExerciseRms';
import { ExerciseSetList } from '../components/ExerciseSetList';
import { ExerciseSheetSkeleton } from '../components/ExerciseSheetSkeleton';
import { RmFormModal } from '../components/RmFormModal';
import {
  RoutineLoadError,
  type RoutineQuery,
} from '../components/RoutineLoadError';
import {
  getSetTicks,
  subscribeSetTicks,
  ticksKey,
  toggleSetTick,
} from '../exerciseTicksStore';
import { routinePath } from '../homeState';
import {
  useIndividualRoutine,
  usePlanRoutine,
} from '../hooks/useRoutineDetail';
import {
  exerciseAccess,
  findRoutineExercise,
  individualView,
  planSessionView,
  type RoutineAssignment,
  type RoutineExercise,
  type RoutineView,
} from '../routineDetail';
import styles from './RoutineExercisePage.module.css';

/**
 * Detalle de un ejercicio de la rutina del Usuario (CU-U-10 a CU-U-13). Se abre desde el detalle de la
 * rutina y cuelga de sus rutas: `/u/rutina/:id/ejercicio/:routineExerciseId` (una rutina individual) y
 * `/u/rutina/plan/:userPlanificationId/:routineAsignationId/ejercicio/:routineExerciseId` (una de una
 * semana del plan). El ejercicio sale del mismo detalle de la rutina, sin otro pedido.
 */
export function RoutineExercisePage() {
  const { id, userPlanificationId, routineAsignationId, routineExerciseId } =
    useParams();
  if (!routineExerciseId) return null;
  if (id) {
    return (
      <IndividualExercise
        assignmentId={id}
        routineExerciseId={routineExerciseId}
      />
    );
  }
  if (userPlanificationId && routineAsignationId) {
    return (
      <PlanExercise
        userPlanificationId={userPlanificationId}
        routineAsignationId={routineAsignationId}
        routineExerciseId={routineExerciseId}
      />
    );
  }
  // Las dos rutas traen alguno de los dos pares de ids.
  return null;
}

function IndividualExercise({
  assignmentId,
  routineExerciseId,
}: {
  assignmentId: string;
  routineExerciseId: string;
}) {
  const query = useIndividualRoutine(assignmentId);
  const view = useMemo(
    () => (query.data ? individualView(query.data) : undefined),
    [query.data],
  );
  const assignment: RoutineAssignment = { kind: 'individual', assignmentId };
  return (
    <ExerciseScreen
      query={query}
      view={view}
      assignment={assignment}
      routineExerciseId={routineExerciseId}
    />
  );
}

function PlanExercise({
  userPlanificationId,
  routineAsignationId,
  routineExerciseId,
}: {
  userPlanificationId: string;
  routineAsignationId: string;
  routineExerciseId: string;
}) {
  const query = usePlanRoutine(userPlanificationId, routineAsignationId);
  const view = useMemo(
    () => (query.data ? planSessionView(query.data) : undefined),
    [query.data],
  );
  const assignment: RoutineAssignment = {
    kind: 'plan',
    userPlanificationId,
    routineAsignationId,
  };
  return (
    <ExerciseScreen
      query={query}
      view={view}
      assignment={assignment}
      routineExerciseId={routineExerciseId}
    />
  );
}

function ExerciseScreen({
  query,
  view,
  assignment,
  routineExerciseId,
}: {
  query: RoutineQuery;
  view: RoutineView | undefined;
  assignment: RoutineAssignment;
  routineExerciseId: string;
}) {
  const { state } = useLocation();
  const found = view && findRoutineExercise(view.routine, routineExerciseId);

  let content;
  if (query.isError) {
    content = <RoutineLoadError query={query} />;
  } else if (!view) {
    content = <ExerciseSheetSkeleton />;
  } else if (!found) {
    // El detalle trae solo los ejercicios activos (y los que el alumno hizo): uno que el entrenador sacó
    // de la rutina sin que el alumno lo hiciera ya no está.
    content = (
      <ErrorState
        title="No encontramos el ejercicio"
        message="Puede que tu entrenador lo haya sacado de la rutina. Volvé a la rutina y buscalo de nuevo."
      />
    );
  } else {
    content = (
      <ExerciseBody
        view={view}
        exercise={found.exercise}
        routineExerciseId={routineExerciseId}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={
          found
            ? `Circuito ${found.circuit.order} · ${found.circuit.circuit.name}`
            : undefined
        }
        title={found?.exercise.exercise.name ?? 'Ejercicio'}
        back={routinePath(assignment)}
        backState={state}
      />
      {content}
    </>
  );
}

/** "4×8" si el ejercicio tiene un solo bloque de series; si tiene varios, cuántas series suman. */
function targetSummary(exercise: RoutineExercise): string | null {
  const blocks = exercise.sets;
  if (blocks.length === 0) return null;
  if (blocks.length === 1) {
    const [block] = blocks;
    const reps = block.amrap
      ? block.rep_count > 1
        ? `${block.rep_count}+`
        : 'AMRAP'
      : String(block.rep_count);
    return `${block.set_count}×${reps}`;
  }
  const total = blocks.reduce((sum, block) => sum + block.set_count, 0);
  return `${total} series`;
}

function ExerciseBody({
  view,
  exercise,
  routineExerciseId,
}: {
  view: RoutineView;
  exercise: RoutineExercise;
  routineExerciseId: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  // La ruta pide sesión y rol Usuario, así que siempre hay usuario.
  const userId = user?.id ?? '';
  const catalog = exercise.exercise;
  const { assignment } = view;

  const access = exerciseAccess(view);
  const finished = view.finished.get(routineExerciseId);
  const rows = useMemo(() => expandSetBlocks(exercise.sets), [exercise.sets]);

  // Los músculos son un agregado de la ficha: si no llegan, la ficha se ve igual.
  const detail = useExercise(catalog.id, { placeholderFromList: true });

  const rmsQuery = useUserRms(userId, userId !== '');
  const rms = useMemo(
    () =>
      rmsQuery.data ? rmsOfExercise(rmsQuery.data, catalog.id) : undefined,
    [rmsQuery.data, catalog.id],
  );
  const [registeringRm, setRegisteringRm] = useState(false);

  const key = ticksKey(userId, assignment, routineExerciseId);
  const ticks = useSyncExternalStore(subscribeSetTicks, () => getSetTicks(key));
  const interactive = access === 'open' && !finished;
  const doneCount = finished ? rows.length : ticks.size;
  const summary = targetSummary(exercise);
  const latestRm = rms?.[0];

  return (
    <>
      <ExerciseHero
        exercise={catalog}
        muscles={detail.data?.exercisedMuscles}
      />
      <div className={styles.columns}>
        <div>
          <Columns className={styles.figures}>
            <Card className={styles.figure}>
              {latestRm ? (
                <>
                  <div className={cx(styles.value, styles.rm)}>
                    {formatDecimal(latestRm.weight)}
                    <span className={styles.unit}> kg</span>
                  </div>
                  <div className={styles.label}>Tu RM actual</div>
                  <div className={styles.label}>
                    {latestRm.reps} {latestRm.reps === 1 ? 'rep' : 'reps'} ·{' '}
                    {formatDate(latestRm.date)}
                  </div>
                </>
              ) : rms ? (
                <>
                  <div className={styles.none}>Sin RM</div>
                  <LinkButton onClick={() => setRegisteringRm(true)}>
                    Registrar RM
                  </LinkButton>
                </>
              ) : (
                // Cargando o con error: el aviso del error está en la sección de RMs, más abajo.
                <>
                  <div className={styles.value}>—</div>
                  <div className={styles.label}>Tu RM actual</div>
                </>
              )}
            </Card>
            <Card className={styles.figure}>
              <div className={styles.value}>{summary ?? '—'}</div>
              <div className={styles.label}>Series objetivo</div>
            </Card>
          </Columns>

          <SectionHeader
            title="Mis series"
            aside={
              (interactive || finished) &&
              rows.length > 0 &&
              `${doneCount} de ${rows.length} hechas`
            }
          />
          {rows.length === 0 ? (
            <EmptyState
              icon="dumbbell"
              message="Tu entrenador no cargó series para este ejercicio."
            />
          ) : (
            <ExerciseSetList
              rows={rows}
              ticks={ticks}
              done={Boolean(finished)}
              interactive={interactive}
              onToggle={(index) => toggleSetTick(key, index)}
            />
          )}
          <Button
            variant="ghost"
            icon="timer"
            className={styles.timer}
            onClick={() => void navigate('/u/timer')}
          >
            Temporizador de descanso
          </Button>

          {exercise.coach_note && (
            <Note tone="acc" icon="note" className={styles.coachNote}>
              <b>Nota de tu entrenador:</b> {exercise.coach_note}
            </Note>
          )}
          <ExerciseLog
            assignment={assignment}
            access={access}
            routineExerciseId={routineExerciseId}
            finished={finished}
          />
        </div>
        <div>
          <ExerciseRms
            rms={rms}
            error={rmsQuery.isError ? getErrorMessage(rmsQuery.error) : null}
            onRetry={() => void rmsQuery.refetch()}
            retrying={rmsQuery.isRefetching}
            onRegister={() => setRegisteringRm(true)}
          />
          <ExerciseDetails exercise={catalog} />
        </div>
      </div>
      <RmFormModal
        target={registeringRm ? 'new' : null}
        userId={userId}
        exercises={[{ id: catalog.id, name: catalog.name }]}
        initialExerciseId={catalog.id}
        onClose={() => setRegisteringRm(false)}
      />
    </>
  );
}
