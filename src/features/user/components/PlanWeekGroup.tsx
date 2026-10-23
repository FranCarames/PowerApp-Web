import type { RoutineAssignedPlanWeek } from '@/api/types';
import { Card, FiberBar, List, Pill } from '@/shared/ui';

import {
  progressPercent,
  progressText,
  routineLetter,
  sumProgress,
} from '../homeWeek';
import { HomeRoutineRow } from './HomeRoutineRow';
import styles from './PlanWeekGroup.module.css';

interface PlanWeekGroupProps {
  group: RoutineAssignedPlanWeek;
  onOpenRoutine: (
    userPlanificationId: string,
    routineAsignationId: string,
  ) => void;
}

/**
 * Una planificación del alumno en la semana que se ve: su tarjeta con el nombre, la semana del plan
 * y lo que hizo en esta semana, y debajo sus rutinas en el orden del entrenador, sin día.
 */
export function PlanWeekGroup({ group, onOpenRoutine }: PlanWeekGroupProps) {
  const { user_planification: assignment, week, routines } = group;
  const { planification } = assignment;
  const name = planification.name ?? 'Planificación';
  const progress = sumProgress(routines.map((routine) => routine.progress));
  const percent = progressPercent(progress);
  const weekText =
    planification.duration > 0
      ? `Semana ${week} de ${planification.duration}`
      : `Semana ${week}`;

  return (
    <section aria-label={name} className={styles.group}>
      <Card tone="pri" className={styles.plan}>
        <div className={styles.head}>
          <div className={styles.titles}>
            <div className={styles.nameRow}>
              <h3 className={styles.name}>{name}</h3>
              {!planification.active && <Pill tone="warn">Dada de baja</Pill>}
            </div>
            <div className={styles.sub}>
              {weekText} · {progressText(progress)}
            </div>
          </div>
          <div className={styles.percent}>{percent}%</div>
        </div>
        <FiberBar value={percent} label={`Progreso de ${name} esta semana`} />
        {assignment.coach_note && (
          <p className={styles.coachNote}>
            <b>Tu entrenador:</b> {assignment.coach_note}
          </p>
        )}
      </Card>
      {routines.length === 0 ? (
        <p className={styles.empty}>Esta semana del plan no tiene rutinas.</p>
      ) : (
        <List columns={2}>
          {routines.map((routine, index) => (
            <HomeRoutineRow
              key={routine.routine_asignation_id}
              kind="plan"
              letter={routineLetter(index)}
              name={routine.routine.name}
              progress={routine.progress}
              removed={!routine.active}
              inactive={!routine.routine.active}
              onOpen={() =>
                onOpenRoutine(assignment.id, routine.routine_asignation_id)
              }
            />
          ))}
        </List>
      )}
    </section>
  );
}
