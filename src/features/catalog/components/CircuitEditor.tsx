import type { ReactNode } from 'react';

import { getErrorMessage, isApiError } from '@/api/errors';
import {
  Columns,
  ErrorState,
  PageHeader,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { useCircuit, useCircuitUsage } from '../hooks/useCircuits';
import { CircuitForm } from './CircuitForm';
import styles from './CircuitEditor.module.css';

interface CircuitEditorProps {
  /** El id del circuito de la ruta: `nuevo` para el alta. */
  id: string;
  /** La ruta de los circuitos del rol (`/a/circuitos` o `/c/circuitos`): el "Volver" y adonde se vuelve al guardar. */
  basePath: string;
}

/**
 * La pantalla de alta y edición de un circuito (CU-E-22 a CU-E-24), la misma del Admin
 * (`/a/circuitos/:id`) y del Entrenador (`/c/circuitos/:id`): el encabezado y el formulario, con
 * la carga, el error y el "No encontramos el circuito" del detalle.
 */
export function CircuitEditor({ id, basePath }: CircuitEditorProps) {
  return id === 'nuevo' ? (
    <NewCircuit basePath={basePath} />
  ) : (
    <EditCircuit id={id} basePath={basePath} />
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
        eyebrow={isNew ? 'Nuevo' : 'Editar'}
        title="Circuito"
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
      <VisuallyHidden role="status">Cargando el circuito…</VisuallyHidden>
      <SkeletonField />
      <Columns>
        <SkeletonField />
        <SkeletonField />
      </Columns>
      <Skeleton height={140} radius={16} />
    </div>
  );
}

function NewCircuit({ basePath }: { basePath: string }) {
  return (
    <Layout isNew basePath={basePath}>
      <CircuitForm basePath={basePath} />
    </Layout>
  );
}

function EditCircuit({ id, basePath }: { id: string; basePath: string }) {
  const circuit = useCircuit(id);
  // Las rutinas que lo usan, para el aviso. Si no llega, el aviso no sale y no se bloquea nada.
  const usage = useCircuitUsage();
  const notFound = isApiError(circuit.error) && circuit.error.status === 404;

  return (
    <Layout isNew={false} basePath={basePath}>
      {circuit.data ? (
        <CircuitForm
          basePath={basePath}
          // Al duplicar se pasa a la copia: el formulario arranca de nuevo con sus datos.
          key={circuit.data.id}
          circuit={circuit.data}
          routines={usage.data ? (usage.data.get(id) ?? []) : undefined}
        />
      ) : circuit.isError ? (
        <ErrorState
          title={notFound ? 'No encontramos el circuito' : undefined}
          message={
            notFound
              ? 'No hay ningún circuito con ese enlace. Volvé a la lista.'
              : getErrorMessage(circuit.error)
          }
          // Un 404 se repetiría igual: no se ofrece reintentar.
          onRetry={notFound ? undefined : () => void circuit.refetch()}
          retrying={circuit.isRefetching}
        />
      ) : (
        <FormSkeleton />
      )}
    </Layout>
  );
}
