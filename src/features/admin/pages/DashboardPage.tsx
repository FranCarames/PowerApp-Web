import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T30): el panel del Admin reemplaza esta pantalla.
export function DashboardPage() {
  return (
    <>
      <PageHeader eyebrow="Panel" title="Administración" />
      <EmptyState
        icon="home"
        title="Pantalla en construcción"
        message="El panel se arma en la tarea T30."
      />
    </>
  );
}
