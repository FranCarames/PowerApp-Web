import { useState } from 'react';
import { useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { PlanificationListItem } from '@/api/types';
import { useUser } from '@/features/account/hooks/useUser';
import { fullName } from '@/shared/lib/fullName';
import {
  Avatar,
  ErrorState,
  ListItem,
  Note,
  PageHeader,
  Pill,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { AssignPlanForm } from '../components/AssignPlanForm';
import { AssignPlanLayout } from '../components/AssignPlanLayout';
import { PlanPicker } from '../components/PlanPicker';
import styles from './AssignStudentPlanPage.module.css';

/**
 * Asignar una planificación a un alumno desde el alumno (CU-E-13), en `/c/alumnos/:id/asignar`: el
 * alumno ya viene elegido (el "Asignar planificación" de su detalle) y se elige la planificación, las
 * fechas y la nota. A un alumno con la cuenta cerrada el backend no se la asigna (400): se avisa y no hay
 * nada que elegir.
 */
export function AssignStudentPlanPage() {
  const { id } = useParams();
  const student = useUser(id ?? null);
  const [plan, setPlan] = useState<PlanificationListItem | null>(null);
  const back = `/c/alumnos/${id}`;

  // Un id que no es un UUID da 400 y uno que no existe, 404. Un entrenador o un admin no son alumnos.
  const notFound =
    (isApiError(student.error) &&
      (student.error.status === 404 || student.error.status === 400)) ||
    (student.data !== undefined && student.data.role !== 'user');

  if (!student.data || notFound) {
    return (
      <>
        <PageHeader
          eyebrow="Alumno"
          title="Asignar planificación"
          back="/c/alumnos"
        />
        {notFound ? (
          <ErrorState
            title="No encontramos al alumno"
            message="No hay ningún alumno con ese enlace. Volvé a la lista."
          />
        ) : student.isError ? (
          <ErrorState
            message={getErrorMessage(student.error)}
            onRetry={() => void student.refetch()}
            retrying={student.isRefetching}
          />
        ) : (
          <div aria-busy="true">
            <VisuallyHidden role="status">Cargando el alumno…</VisuallyHidden>
            <Skeleton height={68} radius={16} className={styles.skeleton} />
            <Skeleton height={68} radius={16} />
          </div>
        )}
      </>
    );
  }

  const person = student.data;
  const name = fullName(person);

  return (
    <AssignPlanLayout
      eyebrow={name}
      title="Asignar planificación"
      back={back}
      notice={
        !person.active && (
          <Note tone="warn" icon="alert" className={styles.note}>
            La cuenta está inactiva: no se le puede asignar una planificación.
            Reactivala desde su detalle.
          </Note>
        )
      }
      fixed={{
        label: 'Alumno',
        content: (
          <ListItem
            leading={
              <Avatar
                name={name}
                src={person.profile_picture}
                size={36}
                tone={person.active ? 'pri' : 'gray'}
              />
            }
            title={name}
            subtitle={person.email}
            trailing={
              !person.active ? <Pill tone="warn">Inactivo</Pill> : undefined
            }
          />
        ),
      }}
      choice={
        person.active
          ? {
              label: 'Planificación',
              content: <PlanPicker plan={plan} onChange={setPlan} />,
            }
          : undefined
      }
    >
      {person.active &&
        (plan ? (
          <AssignPlanForm
            key={plan.id}
            plan={plan}
            student={person}
            returnTo={back}
          />
        ) : (
          <p className={styles.hint}>
            Elegí una planificación para indicar las fechas.
          </p>
        ))}
    </AssignPlanLayout>
  );
}
