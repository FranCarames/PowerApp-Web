import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T19): el listado de circuitos reemplaza esta pantalla.
export function CircuitsPage() {
  return (
    <>
      <PageHeader eyebrow="Entrenamiento" title="Circuitos" />
      <EmptyState
        icon="cycle"
        title="Pantalla en construcción"
        message="El listado de circuitos se arma en la tarea T19."
      />
    </>
  );
}
