import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import { useUser } from '@/features/account/hooks/useUser';
import { exercisesQuery } from '@/features/catalog/hooks/useExercises';
import { toCalendarDay } from '@/shared/lib/dates';
import { fullName } from '@/shared/lib/fullName';
import {
  addMonths,
  exerciseTimes,
  monthRange,
  resolveMonth,
} from '@/shared/lib/trainingHistory';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  Tabs,
  VisuallyHidden,
} from '@/shared/ui';

import { HistoryCalendarView } from '../components/HistoryCalendarView';
import { HistoryExerciseView } from '../components/HistoryExerciseView';
import { HistorySessionsView } from '../components/HistorySessionsView';
import {
  FROM_LIST_STATE,
  RETURN_TO_ROW_STATE,
  historyPath,
  openedFromList,
  rememberHistoryClosed,
} from '../history';
import { useTrainingHistory } from '../hooks/useTrainingHistory';
import styles from './StudentHistoryPage.module.css';

const TITLE = 'Historial de entrenamientos';
const PANEL_ID = 'historial-panel';

type View = 'sessions' | 'calendar';

const TABS = [
  {
    value: 'sessions',
    label: 'Sesiones',
    icon: 'list',
    id: 'historial-tab-sesiones',
  },
  {
    value: 'calendar',
    label: 'Calendario',
    icon: 'calendar',
    id: 'historial-tab-calendario',
  },
] as const;

/** Un 404, o un 400 porque el id no es un UUID: el alumno (o el ejercicio) no existe. */
function isNotFound(error: unknown): boolean {
  return isApiError(error) && (error.status === 404 || error.status === 400);
}

/** Cómo se cambia la URL: `replace` para la pestaña y el mes, `push` para entrar a un ejercicio. */
interface UrlChange {
  replace: boolean;
  state?: unknown;
  /** No volver arriba (la pestaña y el mes): la pantalla sigue siendo la misma. */
  keepScroll?: boolean;
}

/**
 * El historial de entrenamientos de un alumno (CU-E-06 y CU-E-07), en `/c/alumnos/:id/historial`: las
 * pestañas Sesiones y Calendario y el detalle de un ejercicio. La vista, el mes y el ejercicio van en la
 * URL (`?vista=calendario`, `?mes=AAAA-MM` y `?ejercicio=<id>`); el resto de lo que se toca, no. Reglas y
 * textos: la spec del 4/11 de PowerApp-Docs (`Doc/specs/2026-11-04-historial-de-entrenamientos-design.md`).
 */
export function StudentHistoryPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const titleRef = useRef<HTMLHeadingElement>(null);
  // El mes a dejar en la lista al volver del detalle con «atrás» (sección 3, EJE-05).
  const restoreMonth = useRef<string | null | undefined>(undefined);

  const student = useUser(id || null);
  // La misma consulta que pidió la ficha: si está fresca, entrar no la repite.
  const history = useTrainingHistory(id);
  const sessions = history.data;
  const today = toCalendarDay();

  const done = useMemo(() => exerciseTimes(sessions ?? []), [sessions]);
  const range = monthRange(sessions ?? [], today);
  const month = resolveMonth(searchParams.get('mes'), range);
  const view: View =
    searchParams.get('vista') === 'calendario' ? 'calendar' : 'sessions';
  // Sin historial no hay detalle: el estado vacío no tiene filtro (5.2).
  const exerciseId =
    sessions && sessions.length > 0 ? searchParams.get('ejercicio') : null;

  // El nombre del ejercicio sale del historial o, si no lo hizo nunca, del catálogo (8.1).
  const fromHistory = done.find(({ id: doneId }) => doneId === exerciseId);
  const catalog = useQuery({
    ...exercisesQuery(),
    enabled: exerciseId !== null && fromHistory === undefined,
  });
  const fromCatalog = catalog.data?.find(
    ({ id: catalogId }) => catalogId === exerciseId,
  );
  const exercise =
    exerciseId === null
      ? null
      : (fromHistory ??
        (fromCatalog && { id: exerciseId, name: fromCatalog.name }));

  // El historial se cerró: la ficha devuelve el foco a su fila al volver con «atrás» (spec 11).
  useEffect(() => () => rememberHistoryClosed(id), [id]);

  // Al abrir el detalle de un ejercicio y al volver de él, la página vuelve arriba y el foco va al título.
  const shownExercise = useRef(exerciseId);
  useEffect(() => {
    if (shownExercise.current === exerciseId) return;
    shownExercise.current = exerciseId;
    window.scrollTo(0, 0);
    titleRef.current?.focus({ preventScroll: true });
  }, [exerciseId]);

  // «Todo el historial» volvió con «atrás»: la lista queda en el mes que se eligió en el detalle.
  useEffect(() => {
    const wanted = restoreMonth.current;
    if (wanted === undefined || exerciseId !== null) return;
    restoreMonth.current = undefined;
    if (searchParams.get('mes') === wanted) return;
    const next = new URLSearchParams(searchParams);
    if (wanted === null) next.delete('mes');
    else next.set('mes', wanted);
    navigate(
      { search: `?${next}` },
      { replace: true, state: location.state, preventScrollReset: true },
    );
  }, [exerciseId, searchParams, navigate, location.state]);

  function change(
    params: Record<string, string | null>,
    { replace, state, keepScroll = false }: UrlChange,
  ) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(params)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const search = next.toString();
    navigate(
      { search: search ? `?${search}` : '' },
      { replace, state, preventScrollReset: keepScroll },
    );
  }

  function selectView(next: View) {
    change(
      { vista: next === 'calendar' ? 'calendario' : null },
      { replace: true, state: location.state, keepScroll: true },
    );
  }

  function moveMonth(step: -1 | 1) {
    const target = addMonths(month, step);
    change(
      { mes: target === range.last ? null : target },
      { replace: true, state: location.state, keepScroll: true },
    );
  }

  function openExercise(next: string | null) {
    if (next === null) {
      backToList();
      return;
    }
    if (next === exerciseId) return;
    // Desde la lista agrega una entrada; de un ejercicio a otro, la reemplaza: «atrás» vuelve a la lista.
    if (exerciseId === null) {
      change({ ejercicio: next }, { replace: false, state: FROM_LIST_STATE });
    } else {
      change({ ejercicio: next }, { replace: true, state: location.state });
    }
  }

  function backToList(event?: MouseEvent<HTMLAnchorElement>) {
    event?.preventDefault();
    if (openedFromList(location.state)) {
      restoreMonth.current = searchParams.get('mes');
      navigate(-1);
    } else {
      change({ ejercicio: null }, { replace: true });
    }
  }

  const listSearch = new URLSearchParams(searchParams);
  listSearch.delete('ejercicio');
  const listUrl = `${historyPath(id)}${listSearch.size ? `?${listSearch}` : ''}`;
  const name = student.data ? fullName(student.data) : undefined;

  const notFound =
    isNotFound(student.error) ||
    isNotFound(history.error) ||
    (student.data !== undefined && student.data.role !== 'user');

  if (notFound) {
    return (
      <>
        <PageHeader eyebrow="Alumnos" title={TITLE} back="/c/alumnos" />
        <ErrorState
          title="No encontramos al alumno"
          message="No hay ningún alumno con ese enlace. Volvé a la lista."
        />
      </>
    );
  }

  const header =
    exerciseId !== null ? (
      <PageHeader
        eyebrow={name ? `${name} · ${TITLE}` : TITLE}
        title={exercise?.name ?? 'Ejercicio'}
        back={listUrl}
        backLabel="Todo el historial"
        onBack={backToList}
        titleRef={titleRef}
      />
    ) : (
      <PageHeader
        eyebrow={name}
        title={TITLE}
        back={`/c/alumnos/${id}`}
        backState={RETURN_TO_ROW_STATE}
        titleRef={titleRef}
      />
    );

  if (history.isError || student.isError) {
    const failed = history.isError ? history : student;
    return (
      <>
        {header}
        <ErrorState
          message={getErrorMessage(failed.error)}
          onRetry={() => void failed.refetch()}
          retrying={failed.isRefetching}
        />
      </>
    );
  }

  if (!sessions || !student.data) {
    return (
      <>
        {header}
        <div aria-busy="true" className={styles.loading}>
          <VisuallyHidden role="status">Cargando el historial…</VisuallyHidden>
          <Skeleton height={48} radius={12} />
          <Skeleton height={72} radius={14} />
          <Skeleton height={220} radius={16} />
        </div>
      </>
    );
  }

  if (sessions.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon="list"
          title="Todavía no registra entrenamientos"
          message="Cuando el alumno marque ejercicios como hechos, sus sesiones van a aparecer acá."
        />
      </>
    );
  }

  const arrows = {
    month,
    canGoBack: month > range.first,
    canGoForward: month < range.last,
    onMove: moveMonth,
    today,
  };

  if (exerciseId !== null) {
    let content;
    if (exercise) {
      content = (
        <HistoryExerciseView
          key={exercise.id}
          studentId={id}
          exercise={exercise}
          done={done}
          onSelectExercise={openExercise}
          {...arrows}
        />
      );
    } else if (catalog.isError) {
      content = (
        <ErrorState
          message={getErrorMessage(catalog.error)}
          onRetry={() => void catalog.refetch()}
          retrying={catalog.isRefetching}
        />
      );
    } else if (catalog.isPending) {
      content = (
        <div aria-busy="true" className={styles.loading}>
          <VisuallyHidden role="status">Cargando el ejercicio…</VisuallyHidden>
          <Skeleton height={72} radius={14} />
        </div>
      );
    } else {
      content = (
        <EmptyState
          icon="alert"
          title="No encontramos el ejercicio"
          message={null}
          action={
            <Button sm variant="sec" onClick={() => backToList()}>
              Todo el historial
            </Button>
          }
        />
      );
    }
    return (
      <>
        {header}
        {content}
      </>
    );
  }

  return (
    <>
      {header}
      <Tabs
        options={TABS}
        value={view}
        onChange={selectView}
        label="Vista del historial"
        panelId={PANEL_ID}
        className={styles.tabs}
      />
      <div
        role="tabpanel"
        id={PANEL_ID}
        aria-labelledby={TABS.find(({ value }) => value === view)?.id}
      >
        {view === 'calendar' ? (
          <HistoryCalendarView
            sessions={sessions}
            onOpenExercise={openExercise}
            {...arrows}
          />
        ) : (
          <HistorySessionsView
            sessions={sessions}
            done={done}
            onOpenExercise={openExercise}
            {...arrows}
          />
        )}
      </div>
    </>
  );
}
