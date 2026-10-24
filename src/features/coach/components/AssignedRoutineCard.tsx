import type { ReactNode } from 'react';

import type { RoutineAssignedListItem } from '@/api/types';
import { formatDate } from '@/shared/lib/dates';
import { Card, Pill } from '@/shared/ui';

import {
  ASSIGNED_WHEN_LABEL,
  ASSIGNED_WHEN_TONE,
  assignedRoutineWhen,
} from '../assignedRoutine';
import styles from './AssignedRoutineCard.module.css';

/** "Sin ejercicios hechos" o "2 de 5 ejercicios hechos": lo que el alumno avanzó en esa rutina. */
function progressText({
  finished,
  total,
}: RoutineAssignedListItem['progress']) {
  if (finished === 0) return 'Sin ejercicios hechos';
  const done = finished === 1 ? 'hecho' : 'hechos';
  return `${finished} de ${total} ejercicio${total === 1 ? '' : 's'} ${done}`;
}

/**
 * Una rutina puntual de un alumno: el nombre de la rutina, el día (hoy, próxima o pasada), cuánto avanzó
 * el alumno y, si el entrenador la dio de baja después de asignarla, un aviso: la asignación sigue
 * vigente. `action` es lo que se puede hacer con ella (Quitar), al pie.
 */
export function AssignedRoutineCard({
  assignment,
  action,
}: {
  assignment: RoutineAssignedListItem;
  action?: ReactNode;
}) {
  const { routine, date, progress } = assignment;
  const when = assignedRoutineWhen(assignment);

  return (
    <Card>
      <div className={styles.head}>
        <span className={styles.name}>{routine.name}</span>
        <Pill tone={ASSIGNED_WHEN_TONE[when]}>{ASSIGNED_WHEN_LABEL[when]}</Pill>
      </div>
      <div className={styles.date}>{formatDate(date)}</div>
      <div className={styles.progress}>{progressText(progress)}</div>
      {!routine.active && (
        <div className={styles.inactive}>
          La rutina está dada de baja, pero esta asignación sigue vigente.
        </div>
      )}
      {action && <div className={styles.foot}>{action}</div>}
    </Card>
  );
}
