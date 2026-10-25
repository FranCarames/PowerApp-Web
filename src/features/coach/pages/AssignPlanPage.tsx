import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { User } from '@/api/types';
import { usePlanification } from '@/features/catalog/hooks/usePlanification';
import { formatWeeks } from '@/shared/lib/format';
import { capitalize } from '@/shared/lib/text';
import {
  Button,
  ErrorState,
  ListItem,
  Note,
  PageHeader,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { AssignPlanForm } from '../components/AssignPlanForm';
import { AssignLayout } from '../components/AssignLayout';
import { StudentPicker } from '../components/StudentPicker';
import styles from './AssignPlanPage.module.css';

const BACK = '/c/planes';

/**
 * Asignar una planificación a un alumno desde la planificación (CU-E-13), en `/c/planes/:id/asignar`: el
 * plan ya viene elegido (el "Asignar" de su tarjeta) y se elige al alumno, las fechas y la nota. Solo se
 * asigna un plan activo con al menos una rutina vigente, y a un alumno con la cuenta abierta.
 */
export function AssignPlanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plan = usePlanification(id ?? null);
  const [student, setStudent] = useState<User | null>(null);

  // Un id que no es un UUID da 400 y uno que no existe, 404.
  const notFound =
    isApiError(plan.error) &&
    (plan.error.status === 404 || plan.error.status === 400);

  if (!plan.data) {
    return (
      <>
        <PageHeader
          eyebrow="Planificación"
          title="Asignar a un alumno"
          back={BACK}
        />
        {notFound ? (
          <ErrorState
            title="No encontramos la planificación"
            message="No hay ninguna planificación con ese enlace. Volvé a la lista."
          />
        ) : plan.isError ? (
          <ErrorState
            message={getErrorMessage(plan.error)}
            onRetry={() => void plan.refetch()}
            retrying={plan.isRefetching}
          />
        ) : (
          <div aria-busy="true">
            <VisuallyHidden role="status">
              Cargando la planificación…
            </VisuallyHidden>
            <Skeleton height={68} radius={16} className={styles.skeleton} />
            <Skeleton height={68} radius={16} />
          </div>
        )}
      </>
    );
  }

  const { name, type, duration, active, routine_count } = plan.data;
  const blocked = !active
    ? 'Esta planificación está dada de baja: no se ofrece para asignaciones nuevas. Reactivala desde su editor para asignarla.'
    : routine_count === 0
      ? 'Esta planificación no tiene rutinas vigentes. Agregale alguna desde su editor para poder asignarla.'
      : null;

  return (
    <AssignLayout
      eyebrow={`Planificación · ${name || 'Sin nombre'}`}
      title="Asignar a un alumno"
      back={BACK}
      notice={
        blocked && (
          <Note tone="warn" icon="alert" className={styles.note}>
            {blocked}
          </Note>
        )
      }
      fixed={{
        label: 'Planificación',
        content: (
          <ListItem
            title={name || 'Sin nombre'}
            subtitle={`${formatWeeks(duration)}${type ? ` · ${capitalize(type)}` : ''}`}
            meta={`${routine_count} rutina${routine_count === 1 ? '' : 's'}`}
            trailing={
              blocked ? (
                <Button
                  sm
                  variant="ghost"
                  onClick={() => navigate(`${BACK}/${plan.data.id}`)}
                >
                  Abrir editor
                </Button>
              ) : undefined
            }
          />
        ),
      }}
      choice={
        blocked
          ? undefined
          : {
              label: 'Alumno',
              content: (
                <StudentPicker
                  activeOnly
                  student={student}
                  onChange={setStudent}
                />
              ),
            }
      }
    >
      {!blocked &&
        (student ? (
          <AssignPlanForm
            key={student.id}
            plan={plan.data}
            student={student}
            returnTo={BACK}
          />
        ) : (
          <p className={styles.hint}>
            Elegí un alumno para indicar las fechas.
          </p>
        ))}
    </AssignLayout>
  );
}
