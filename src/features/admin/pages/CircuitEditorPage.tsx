import type { ReactNode } from 'react';
import { useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import {
  useCircuit,
  useCircuitUsage,
} from '@/features/catalog/hooks/useCircuits';
import {
  Columns,
  ErrorState,
  PageHeader,
  Skeleton,
  VisuallyHidden,
} from '@/shared/ui';

import { CircuitForm } from '../components/CircuitForm';
import styles from './CircuitEditorPage.module.css';

const BACK = '/a/circuitos';

/** Alta y edición de un circuito (CU-E-22 a CU-E-24), en `/a/circuitos/nuevo` y `/a/circuitos/:id`. */
export function CircuitEditorPage() {
  const { id } = useParams();
  // La ruta siempre trae el id: `nuevo` para el alta.
  if (!id) return null;
  return id === 'nuevo' ? <NewCircuit /> : <EditCircuit id={id} />;
}

function Layout({ isNew, children }: { isNew: boolean; children: ReactNode }) {
  return (
    <>
      <PageHeader
        eyebrow={isNew ? 'Nuevo' : 'Editar'}
        title="Circuito"
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

function NewCircuit() {
  return (
    <Layout isNew>
      <CircuitForm />
    </Layout>
  );
}

function EditCircuit({ id }: { id: string }) {
  const circuit = useCircuit(id);
  // Las rutinas que lo usan, para el aviso. Si no llega, el aviso no sale y no se bloquea nada.
  const usage = useCircuitUsage();
  const notFound = isApiError(circuit.error) && circuit.error.status === 404;

  return (
    <Layout isNew={false}>
      {circuit.data ? (
        <CircuitForm
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
