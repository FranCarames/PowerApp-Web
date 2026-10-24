import type { ReactNode } from 'react';

import { getErrorMessage, isApiError } from '@/api/errors';
import {
  ErrorState,
  Note,
  PageHeader,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { usePlanification } from '../hooks/usePlanification';
import styles from './PlanEditor.module.css';
import { PlanForm } from './PlanForm';
import { PlanRoutines } from './PlanRoutines';
import { PlanStatusActions } from './PlanStatusActions';

interface PlanEditorProps {
  /** El id de la planificación de la ruta: `nuevo` para el alta. */
  id: string;
  /** La ruta de las planificaciones del rol (`/a/planes` o `/c/planes`): el "Volver" y adonde se vuelve al guardar. */
  basePath: string;
}

/**
 * La pantalla de alta y edición de una planificación (CU-E-09 a CU-E-12), la misma del Admin
 * (`/a/planes/:id`) y del Entrenador (`/c/planes/:id`): el encabezado, la cabecera del plan, sus
 * rutinas por semana y, al editar, eliminar o reactivar. Un plan nuevo solo tiene la cabecera: las
 * rutinas se le agregan una vez creado.
 */
export function PlanEditor({ id, basePath }: PlanEditorProps) {
  return id === 'nuevo' ? (
    <Layout isNew basePath={basePath}>
      <PlanForm basePath={basePath} />
    </Layout>
  ) : (
    <EditPlan id={id} basePath={basePath} />
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
        title="Planificación"
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
      <VisuallyHidden role="status">Cargando la planificación…</VisuallyHidden>
      <SkeletonField />
      <SkeletonField />
      <SkeletonField />
      <SkeletonField />
      <Skeleton height={48} radius={14} />
      <div className={styles.skeletonCards}>
        <Skeleton height={64} radius={16} />
        <Skeleton height={64} radius={16} />
      </div>
    </div>
  );
}

function EditPlan({ id, basePath }: PlanEditorProps) {
  const plan = usePlanification(id);
  const notFound = isApiError(plan.error) && plan.error.status === 404;

  return (
    <Layout isNew={false} basePath={basePath}>
      {plan.data ? (
        <>
          {!plan.data.active && (
            <Note tone="warn" icon="alert">
              Planificación inactiva: no se puede editar ni cambiarle las
              rutinas, y no se ofrece para asignaciones nuevas. Reactivala para
              poder cambiarla.
            </Note>
          )}
          <PlanForm basePath={basePath} plan={plan.data} />
          <PlanRoutines plan={plan.data} />
          <PlanStatusActions plan={plan.data} basePath={basePath} />
        </>
      ) : plan.isError ? (
        <ErrorState
          title={notFound ? 'No encontramos la planificación' : undefined}
          message={
            notFound
              ? 'No hay ninguna planificación con ese enlace. Volvé a la lista.'
              : getErrorMessage(plan.error)
          }
          // Un 404 se repetiría igual: no se ofrece reintentar.
          onRetry={notFound ? undefined : () => void plan.refetch()}
          retrying={plan.isRefetching}
        />
      ) : (
        <FormSkeleton />
      )}
    </Layout>
  );
}
