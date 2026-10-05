import type { ReactNode } from 'react';
import { useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import { useExercise } from '@/features/catalog/hooks/useExercises';
import { useMuscleGroups } from '@/features/catalog/hooks/useMuscleGroups';
import {
  Columns,
  ErrorState,
  PageHeader,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { ExerciseForm } from '../components/ExerciseForm';
import styles from './ExerciseEditorPage.module.css';

const BACK = '/a/ejercicios';

/** Alta y edición de un ejercicio (CU-A-04 y CU-A-05), en `/a/ejercicios/nuevo` y `/a/ejercicios/:id`. */
export function ExerciseEditorPage() {
  const { id } = useParams();
  // La ruta siempre trae el id: `nuevo` para el alta.
  if (!id) return null;
  return id === 'nuevo' ? <NewExercise /> : <EditExercise id={id} />;
}

function Layout({ isNew, children }: { isNew: boolean; children: ReactNode }) {
  return (
    <>
      <PageHeader
        eyebrow={isNew ? 'Nuevo' : 'Editar'}
        title="Ejercicio"
        back={BACK}
      />
      <div className={styles.narrow}>{children}</div>
    </>
  );
}

function SkeletonField() {
  return (
    <div className={styles.skeletonField}>
      <Skeleton width={72} height={12} />
      <Skeleton height={46} radius={12} />
    </div>
  );
}

/** La forma del formulario mientras llegan los datos. */
function FormSkeleton() {
  return (
    <div aria-busy="true">
      <VisuallyHidden role="status">Cargando el ejercicio…</VisuallyHidden>
      <SkeletonField />
      <SkeletonField />
      <Columns>
        <SkeletonField />
        <SkeletonField />
      </Columns>
      <SkeletonField />
      <Skeleton height={48} radius={14} />
    </div>
  );
}

function NewExercise() {
  const groups = useMuscleGroups();

  return (
    <Layout isNew>
      {groups.isPending ? (
        <FormSkeleton />
      ) : groups.isError ? (
        <ErrorState
          message={getErrorMessage(groups.error)}
          onRetry={() => void groups.refetch()}
          retrying={groups.isRefetching}
        />
      ) : (
        <ExerciseForm groups={groups.data} />
      )}
    </Layout>
  );
}

function EditExercise({ id }: { id: string }) {
  const exercise = useExercise(id);
  const groups = useMuscleGroups();
  const failed = [exercise, groups].find((query) => query.isError);
  const notFound = isApiError(exercise.error) && exercise.error.status === 404;

  return (
    <Layout isNew={false}>
      {exercise.data && groups.data ? (
        <ExerciseForm exercise={exercise.data} groups={groups.data} />
      ) : failed ? (
        <ErrorState
          title={notFound ? 'No encontramos el ejercicio' : undefined}
          message={
            notFound
              ? 'Puede que ya se haya eliminado. Volvé a la lista.'
              : getErrorMessage(failed.error)
          }
          // Un 404 se repetiría igual: no se ofrece reintentar.
          onRetry={
            notFound
              ? undefined
              : () =>
                  void Promise.all(
                    [exercise, groups]
                      .filter((query) => query.isError)
                      .map((query) => query.refetch()),
                  )
          }
          retrying={failed.isRefetching}
        />
      ) : (
        <FormSkeleton />
      )}
    </Layout>
  );
}
