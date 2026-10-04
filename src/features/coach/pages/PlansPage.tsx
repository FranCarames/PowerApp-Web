import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T23): el listado de planificaciones reemplaza esta pantalla.
export function PlansPage() {
  return (
    <>
      <PageHeader title="Planificaciones" />
      <EmptyState
        icon="calendar"
        title="Pantalla en construcción"
        message="Las planificaciones se arman en la tarea T23."
      />
    </>
  );
}
