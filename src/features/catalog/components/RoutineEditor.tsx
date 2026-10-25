import type { ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import {
  Columns,
  ErrorState,
  PageHeader,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { useRoutine } from '../hooks/useRoutines';
import { shouldRestoreDraft } from '../routineDraft';
import styles from './RoutineEditor.module.css';
import { RoutineForm } from './RoutineForm';

interface RoutineEditorProps {
  /** El id de la rutina de la ruta: `nuevo` para el alta. */
  id: string;
  /** La ruta de las rutinas del rol (`/a/rutinas` o `/c/rutinas`): el "Volver" y adonde se vuelve al guardar. */
  basePath: string;
  /** La ruta de los circuitos del rol (`/a/circuitos` o `/c/circuitos`): donde se editan y se crean los de la rutina. */
  circuitsPath: string;
  /** Asignar la rutina a un alumno (CU-E-19): es del Entrenador. Sin esto, el editor no ofrece el botón. */
  onAssign?: (routineId: string) => void;
}

/**
 * La pantalla de alta y edición de una rutina (CU-E-16 a CU-E-18), la misma del Admin
 * (`/a/rutinas/:id`) y del Entrenador (`/c/rutinas/:id`): el encabezado y el formulario, con la carga,
 * el error y el "No encontramos la rutina" del detalle.
 */
export function RoutineEditor({
  id,
  basePath,
  circuitsPath,
  onAssign,
}: RoutineEditorProps) {
  // Al volver de un circuito (o con Atrás) el formulario recupera lo que se había escrito.
  const { state } = useLocation();
  const restoreDraft = shouldRestoreDraft(state, useNavigationType());

  return id === 'nuevo' ? (
    <Layout isNew basePath={basePath}>
      <RoutineForm
        basePath={basePath}
        circuitsPath={circuitsPath}
        restoreDraft={restoreDraft}
      />
    </Layout>
  ) : (
    <EditRoutine
      id={id}
      basePath={basePath}
      circuitsPath={circuitsPath}
      onAssign={onAssign}
      restoreDraft={restoreDraft}
    />
  );
}

function Layout({
  isNew,
  basePath,
  children,
}: {
  isNew: boolean;
  basePath: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        eyebrow={isNew ? 'Nueva' : 'Editar'}
        title="Rutina"
        back={basePath}
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
      <VisuallyHidden role="status">Cargando la rutina…</VisuallyHidden>
      <SkeletonField />
      <SkeletonField />
      <div className={styles.skeletonCards}>
        <Skeleton height={120} radius={16} />
        <Skeleton height={120} radius={16} />
      </div>
      <Columns>
        <Skeleton height={48} radius={14} />
        <Skeleton height={48} radius={14} />
      </Columns>
    </div>
  );
}

function EditRoutine({
  id,
  basePath,
  circuitsPath,
  onAssign,
  restoreDraft,
}: RoutineEditorProps & { restoreDraft: boolean }) {
  const routine = useRoutine(id);
  // Un id que no es un UUID da 400, y uno que no existe, 404: los dos son "no la encontramos".
  const notFound =
    isApiError(routine.error) &&
    (routine.error.status === 404 || routine.error.status === 400);

  return (
    <Layout isNew={false} basePath={basePath}>
      {routine.data ? (
        <RoutineForm
          basePath={basePath}
          circuitsPath={circuitsPath}
          routine={routine.data}
          onAssign={onAssign}
          restoreDraft={restoreDraft}
        />
      ) : routine.isError ? (
        <ErrorState
          title={notFound ? 'No encontramos la rutina' : undefined}
          message={
            notFound
              ? 'No hay ninguna rutina con ese enlace. Volvé a la lista.'
              : getErrorMessage(routine.error)
          }
          // Un 404 o un 400 se repetirían igual: no se ofrece reintentar.
          onRetry={notFound ? undefined : () => void routine.refetch()}
          retrying={routine.isRefetching}
        />
      ) : (
        <FormSkeleton />
      )}
    </Layout>
  );
}
