import type { UserPlanificationAssignment } from '@/api/types';
import { Button, Note } from '@/shared/ui';

import styles from './AssignOverlapNote.module.css';
import { UserPlanificationCard } from './UserPlanificationCard';

interface AssignOverlapNoteProps {
  /** Las asignaciones vigentes del alumno que se pisan con las fechas elegidas, las que mandó el 409. */
  overlapping: UserPlanificationAssignment[];
  /** Pide quitar una de ellas (CU-E-14): la pantalla confirma y da de baja. */
  onRemove: (assignment: UserPlanificationAssignment) => void;
}

/**
 * El aviso de solapamiento de CU-E-13: el alumno ya tiene una planificación en esas fechas. Muestra
 * cuáles se pisan y las tres salidas del caso de uso: ajustar las fechas, quitar la vieja (el botón de
 * cada una) o asignar igual (el botón de la pantalla), con lo que las dos conviven.
 */
export function AssignOverlapNote({
  overlapping,
  onRemove,
}: AssignOverlapNoteProps) {
  const several = overlapping.length > 1;

  return (
    <div className={styles.box}>
      <Note tone="warn" icon="alert" role="alert">
        {overlapping.length === 0
          ? 'El alumno ya tiene una planificación en esas fechas.'
          : several
            ? `El alumno ya tiene ${overlapping.length} planificaciones en esas fechas.`
            : 'El alumno ya tiene una planificación en esas fechas.'}{' '}
        Podés ajustar las fechas, quitar{' '}
        {several ? 'las anteriores' : 'la anterior'} o asignarla igual: las dos
        conviven y el alumno ve las dos en su home.
      </Note>
      {overlapping.length > 0 && (
        <div className={styles.list}>
          {overlapping.map((assignment) => (
            <UserPlanificationCard
              key={assignment.id}
              assignment={assignment}
              action={
                <Button
                  sm
                  variant="ghost"
                  aria-label={`Quitar ${assignment.planification.name || 'la planificación'}`}
                  onClick={() => onRemove(assignment)}
                >
                  Quitar
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
