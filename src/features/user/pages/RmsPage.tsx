import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { UserRmWithExercise } from '@/api/pending';
import { useUserRms } from '@/features/account/hooks/useUserRms';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useExercises } from '@/features/catalog/hooks/useExercises';
import { formatDate } from '@/shared/lib/dates';
import { formatWeight } from '@/shared/lib/format';
import { groupRmsByExercise } from '@/shared/lib/rms';
import {
  Button,
  Columns,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  List,
  ListSkeleton,
  PageHeader,
  SectionHeader,
  useToast,
} from '@/shared/ui';

import { RmFormModal } from '../components/RmFormModal';
import { RmRow } from '../components/RmRow';
import { useDeleteRm } from '../hooks/useDeleteRm';
import styles from './RmsPage.module.css';

/**
 * Mis RMs (CU-U-17 a CU-U-20): los récords del alumno agrupados por ejercicio, del más reciente al más
 * antiguo; el alta y la edición en un modal, y el borrado con confirmación. La calculadora (T27) está
 * a un botón.
 */
export function RmsPage() {
  const { user } = useAuth();
  // La ruta pide sesión y rol Usuario, así que siempre hay usuario.
  if (!user) return null;
  return <Rms userId={user.id} />;
}

function Rms({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const query = useUserRms(userId);
  const exercises = useExercises();
  const remove = useDeleteRm();
  const [editing, setEditing] = useState<UserRmWithExercise | 'new' | null>(
    null,
  );
  const [toDelete, setToDelete] = useState<UserRmWithExercise | null>(null);

  const groups = useMemo(
    () => (query.data ? groupRmsByExercise(query.data) : []),
    [query.data],
  );
  const exerciseOptions = useMemo(
    () =>
      exercises.data
        ?.map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [exercises.data],
  );

  function confirmDelete(rm: UserRmWithExercise) {
    remove.mutate(rm.id, {
      onSuccess: () => {
        toast.success('RM eliminado');
        setToDelete(null);
      },
      onError: (error) => {
        toast.error(
          getErrorMessage(error, {
            404: 'Ese RM ya no existe. Actualizamos la lista.',
          }),
        );
        setToDelete(null);
      },
    });
  }

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
    content = <ListSkeleton columns={2} rows={4} />;
  } else if (groups.length === 0) {
    content = (
      <EmptyState
        icon="trophy"
        title="Todavía no registraste ningún RM"
        message="Registrá el primero para seguir tu progreso."
      />
    );
  } else {
    content = groups.map(({ exerciseId, name, rms }) => (
      <section key={exerciseId} className={styles.group}>
        <h3 className={styles.exercise}>
          {name}
          <span className={styles.count}>
            {rms.length} {rms.length === 1 ? 'RM' : 'RMs'}
          </span>
        </h3>
        <List columns={2}>
          {rms.map((rm) => (
            <RmRow
              key={rm.id}
              rm={rm}
              onEdit={setEditing}
              onDelete={setToDelete}
            />
          ))}
        </List>
      </section>
    ));
  }

  return (
    <>
      <PageHeader eyebrow="Récords personales" title="Mis RMs" />
      <Columns>
        <Button icon="plus" onClick={() => setEditing('new')}>
          Registrar RM
        </Button>
        <Button
          variant="sec"
          icon="calc"
          onClick={() => void navigate('/u/calculadora')}
        >
          Calculadora
        </Button>
      </Columns>
      <SectionHeader
        title="Registrados"
        aside={
          !query.isError &&
          query.data &&
          `${groups.length} ${groups.length === 1 ? 'ejercicio' : 'ejercicios'}`
        }
      />
      {content}
      <RmFormModal
        target={editing}
        userId={userId}
        exercises={exerciseOptions}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={toDelete !== null}
        destructive
        title="Eliminar RM"
        message={
          toDelete && (
            <>
              ¿Eliminar el RM de <b>{toDelete.exercise.name}</b> (
              {formatWeight(toDelete.weight)} × {toDelete.reps},{' '}
              {formatDate(toDelete.date)})? No se puede deshacer.
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
