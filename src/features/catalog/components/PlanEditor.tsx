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
import { PlanStatusActions } from './PlanStatusActions';

interface PlanEditorProps {
  /** El id de la planificación de la ruta: `nuevo` para el alta. */
  id: string;
  /** La ruta de las planificaciones del rol (`/a/planes` o `/c/planes`): el "Volver" y adonde se vuelve al guardar. */
  basePath: string;
}

/**
 * La pantalla de alta y edición de una planificación (CU-E-09 a CU-E-12f), la misma del Admin
 * (`/a/planes/:id`) y del Entrenador (`/c/planes/:id`): el encabezado y, en `PlanForm`, la cabecera del plan
 * con sus semanas. Un plan nuevo arma sus semanas en pantalla y las guarda junto con la cabecera; uno
 * guardado cambia sus rutinas al instante y, abajo, se lo puede eliminar o reactivar.
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
      {children}
    </>
  );
}

/** El ancho de los formularios de una columna, para lo que todavía no tiene las dos del editor. */
function Narrow({ children }: { children: ReactNode }) {
  return <div className={styles.narrow}>{children}</div>;
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
  // Un id que no es un UUID da 400, y uno que no existe, 404: los dos son "no la encontramos".
  const notFound =
    isApiError(plan.error) &&
    (plan.error.status === 404 || plan.error.status === 400);

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
          <PlanForm basePath={basePath} plan={plan.data}>
            <PlanStatusActions plan={plan.data} basePath={basePath} />
          </PlanForm>
        </>
      ) : plan.isError ? (
        <Narrow>
          <ErrorState
            title={notFound ? 'No encontramos la planificación' : undefined}
            message={
              notFound
                ? 'No hay ninguna planificación con ese enlace. Volvé a la lista.'
                : getErrorMessage(plan.error)
            }
            // Un 404 o un 400 se repetirían igual: no se ofrece reintentar.
            onRetry={notFound ? undefined : () => void plan.refetch()}
            retrying={plan.isRefetching}
          />
        </Narrow>
      ) : (
        <Narrow>
          <FormSkeleton />
        </Narrow>
      )}
    </Layout>
  );
}
