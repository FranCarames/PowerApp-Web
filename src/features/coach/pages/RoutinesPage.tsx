import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T21 y T19): los listados de rutinas y de circuitos reemplazan esta pantalla.
export function RoutinesPage() {
  return (
    <>
      <PageHeader title="Rutinas" />
      <EmptyState
        icon="list"
        title="Pantalla en construcción"
        message="Las rutinas y los circuitos se arman en las tareas T21 y T19."
      />
    </>
  );
}
