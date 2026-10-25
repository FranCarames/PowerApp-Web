import { useState } from 'react';
import { useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { RoutineListItemPlus } from '@/api/types';
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

import { AssignLayout } from '../components/AssignLayout';
import { AssignRoutineForm } from '../components/AssignRoutineForm';
import { RoutinePicker } from '../components/RoutinePicker';
import styles from './AssignStudentRoutinePage.module.css';

/**
 * Asignar una rutina puntual a un alumno desde el alumno (CU-E-19), en `/c/alumnos/:id/asignar-rutina`: el
 * alumno ya viene elegido (el "Asignar rutina" de su modal "Rutinas puntuales") y se elige la rutina y el
 * día en que la hace. A un alumno con la cuenta cerrada el backend no se la asigna (400): se avisa y no
 * hay nada que elegir.
 */
export function AssignStudentRoutinePage() {
  const { id } = useParams();
  const student = useUser(id ?? null);
  const [routine, setRoutine] = useState<RoutineListItemPlus | null>(null);
  const back = `/c/alumnos/${id}`;

  // Un id que no es un UUID da 400 y uno que no existe, 404. Un entrenador o un admin no son alumnos.
  const notFound =
    (isApiError(student.error) &&
      (student.error.status === 404 || student.error.status === 400)) ||
    (student.data !== undefined && student.data.role !== 'user');

  if (!student.data || notFound) {
    return (
      <>
        <PageHeader eyebrow="Alumno" title="Asignar rutina" back="/c/alumnos" />
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
    <AssignLayout
      eyebrow={name}
      title="Asignar rutina"
      back={back}
      notice={
        !person.active && (
          <Note tone="warn" icon="alert" className={styles.note}>
            La cuenta está inactiva: no se le puede asignar una rutina.
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
              label: 'Rutina',
              content: (
                <RoutinePicker routine={routine} onChange={setRoutine} />
              ),
            }
          : undefined
      }
    >
      {person.active &&
        (routine ? (
          <AssignRoutineForm
            key={routine.id}
            routine={routine}
            student={person}
            returnTo={back}
          />
        ) : (
          <p className={styles.hint}>Elegí una rutina para indicar el día.</p>
        ))}
    </AssignLayout>
  );
}
