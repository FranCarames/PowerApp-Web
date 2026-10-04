import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T35): el listado de entrenadores reemplaza esta pantalla.
export function CoachesPage() {
  return (
    <>
      <PageHeader eyebrow="Gestión" title="Entrenadores" />
      <EmptyState
        icon="shield"
        title="Pantalla en construcción"
        message="Los entrenadores se arman en la tarea T35."
      />
    </>
  );
}
