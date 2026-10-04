import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T26): Mis RMs reemplaza esta pantalla.
export function RmsPage() {
  return (
    <>
      <PageHeader eyebrow="Récords personales" title="Mis RMs" />
      <EmptyState
        icon="trophy"
        title="Pantalla en construcción"
        message="Mis RMs se arma en la tarea T26."
      />
    </>
  );
}
