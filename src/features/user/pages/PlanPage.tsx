import { useNavigate, useLocation, useSearchParams } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cx } from '@/shared/lib/cx';
import {
  isCalendarDay,
  mondayOf,
  toCalendarDay,
  weeksBetween,
} from '@/shared/lib/dates';
import {
  EmptyState,
  ErrorState,
  IconButton,
  LinkButton,
  List,
  ListSkeleton,
  PageHeader,
  SectionHeader,
} from '@/shared/ui';

import { HomeRoutineRow } from '../components/HomeRoutineRow';
import { PlanWeekGroup } from '../components/PlanWeekGroup';
import { WeekSelector } from '../components/WeekSelector';
import {
  type HomeLocationState,
  individualRoutinePath,
  planRoutinePath,
} from '../homeState';
import { useRoutineHome } from '../hooks/useRoutineHome';
import styles from './PlanPage.module.css';

/**
 * Home del Usuario (CU-U-08): las rutinas de una semana, de lunes a domingo. Del plan, un grupo por
 * planificación con su progreso y sus rutinas en el orden del entrenador, sin día; de lo individual,
 * las rutinas que el entrenador asignó para un día. Se mueve de semana con el selector, y la semana
 * queda en la URL (`?semana=2026-10-19`) para que "Volver" desde el detalle la conserve.
 */
export function PlanPage() {
  const { user } = useAuth();
  // La ruta pide sesión y rol Usuario, así que siempre hay usuario.
  if (!user) return null;
  return <Home userId={user.id} firstName={user.first_name} />;
}

function Home({ userId, firstName }: { userId: string; firstName: string }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const today = toCalendarDay();
  const requested = searchParams.get('semana');
  const weekStart = mondayOf(
    requested && isCalendarDay(requested) ? requested : today,
  );
  const isCurrentWeek = weeksBetween(today, weekStart) === 0;
  const query = useRoutineHome(userId, weekStart);

  function goToWeek(next: string) {
    setSearchParams(weeksBetween(today, next) === 0 ? {} : { semana: next }, {
      replace: true,
    });
  }

  function open(path: string) {
    const state: HomeLocationState = { homeSearch: search };
    void navigate(path, { state });
  }

  const week = query.data?.[0];
  const planGroups = week?.plan ?? [];
  // El backend las manda por día; se ordenan igual para no depender de eso.
  const individual = [...(week?.individual ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  let content;
  if (query.isError) {
    content = (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  } else if (query.isPending) {
    content = <ListSkeleton columns={2} rows={3} />;
  } else if (planGroups.length === 0 && individual.length === 0) {
    content = (
      <EmptyState
        icon="dumbbell"
        title="Sin rutinas esta semana"
        message="Todavía no tenés entrenamiento asignado para estos días. Probá con otra semana o consultale a tu entrenador."
      />
    );
  } else {
    content = (
      <div
        className={cx(query.isPlaceholderData && styles.busy)}
        aria-busy={query.isPlaceholderData}
      >
        {planGroups.map((group) => (
          <PlanWeekGroup
            key={group.user_planification.id}
            group={group}
            onOpenRoutine={(userPlanificationId, routineAsignationId) =>
              open(planRoutinePath(userPlanificationId, routineAsignationId))
            }
          />
        ))}
        {individual.length > 0 && (
          <section aria-label="Rutinas individuales">
            {planGroups.length > 0 && (
              <SectionHeader level={3} title="Rutinas individuales" />
            )}
            <List columns={2}>
              {individual.map((routine) => (
                <HomeRoutineRow
                  key={routine.id}
                  kind="individual"
                  date={routine.date}
                  today={routine.date === today}
                  name={routine.routine.name}
                  progress={routine.progress}
                  inactive={!routine.routine.active}
                  onOpen={() => open(individualRoutinePath(routine.id))}
                />
              ))}
            </List>
          </section>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`Hola, ${firstName} 👋`}
        title="Tu plan"
        actions={
          <IconButton
            icon="book"
            label="Biblioteca de ejercicios"
            onClick={() => void navigate('/u/wiki')}
          />
        }
      />
      <SectionHeader
        title="Rutinas de la semana"
        aside={
          <WeekSelector
            weekStart={weekStart}
            today={today}
            onChange={goToWeek}
          />
        }
      />
      {!isCurrentWeek && (
        <div className={styles.back}>
          <LinkButton onClick={() => goToWeek(today)}>
            Volver a esta semana
          </LinkButton>
        </div>
      )}
      {content}
    </>
  );
}
