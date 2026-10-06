import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import { fullName } from '@/shared/lib/fullName';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  List,
  ListSkeleton,
  PageHeader,
  useToast,
} from '@/shared/ui';

import { CoachRow } from '../components/CoachRow';
import { useCoaches, type CoachEntry } from '../hooks/useCoaches';
import { useDeleteCoach } from '../hooks/useDeleteCoach';
import styles from './CoachesPage.module.css';

/**
 * Lo que responde `deleteCoach` (404) cuando el usuario existe pero no tiene registro de Coach: un alta
 * que falló a la mitad le dejó el rol sin los datos. Con ese 404 no hay forma de darlo de baja.
 */
const NO_COACH_RECORD = 'Coach no encontrado';

/**
 * Entrenadores del Admin (CU-A-16 y CU-A-19): el listado con nombre, email profesional y estado, el
 * acceso a convertir un alumno y eliminar, que es una baja lógica con confirmación. Editar los
 * datos del entrenador lo suma T37.
 */
export function CoachesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const coaches = useCoaches();
  const remove = useDeleteCoach();
  const [toDelete, setToDelete] = useState<CoachEntry | null>(null);

  function confirmDelete({ user }: CoachEntry) {
    remove.mutate(user.id, {
      onSuccess: () => {
        toast.success(`${fullName(user)} ya no es entrenador`);
        setToDelete(null);
      },
      onError: (error) => {
        toast.error(
          isApiError(error) && error.serverMessage === NO_COACH_RECORD
            ? 'No se pudo eliminar: la cuenta tiene el rol de entrenador, pero no sus datos profesionales.'
            : getErrorMessage(error, {
                404: 'No encontramos al entrenador. Puede que ya lo hayan eliminado.',
                // No hay rechazo por integridad (V7): el único 500 es una falla del servidor sin motivo.
                500: 'No se pudo eliminar al entrenador. Intentá de nuevo en unos minutos.',
              }),
        );
        setToDelete(null);
      },
    });
  }

  return (
    <>
      <PageHeader eyebrow="Gestión" title="Entrenadores" />
      <Button
        variant="sec"
        icon="plus"
        className={styles.convert}
        onClick={() => navigate('/a/convertir')}
      >
        Convertir alumno en entrenador
      </Button>
      {coaches.data ? (
        coaches.data.length === 0 ? (
          <EmptyState
            icon="shield"
            title="Todavía no hay entrenadores"
            message="Convertí a un alumno para que tenga acceso al panel de entrenador."
          />
        ) : (
          <List columns={2}>
            {coaches.data.map((entry) => (
              <CoachRow
                key={entry.user.id}
                entry={entry}
                onDelete={setToDelete}
              />
            ))}
          </List>
        )
      ) : coaches.isError ? (
        <ErrorState
          message={getErrorMessage(coaches.error)}
          onRetry={coaches.retry}
          retrying={coaches.retrying}
        />
      ) : (
        <ListSkeleton columns={2} rows={3} />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        destructive
        title="Eliminar entrenador"
        message={
          toDelete && (
            <>
              ¿Eliminar a <b>{fullName(toDelete.user)}</b> de los entrenadores?
              Es una baja lógica: pierde el acceso al panel de entrenador y su
              cuenta vuelve a ser la de un alumno, con sus datos intactos. Podés
              volver a convertirla en entrenador cuando quieras.
            </>
          )
        }
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onConfirm={() => toDelete && confirmDelete(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
