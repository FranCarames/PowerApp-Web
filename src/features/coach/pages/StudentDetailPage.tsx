import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T16): el detalle de alumno reemplaza esta pantalla.
export function StudentDetailPage() {
  return (
    <>
      <PageHeader eyebrow="Alumnos" title="Alumno" back="/c/alumnos" />
      <EmptyState
        icon="user"
        title="Pantalla en construcción"
        message="El detalle del alumno se arma en la tarea T16."
      />
    </>
  );
}
