import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T47): el listado de usuarios reemplaza esta pantalla.
export function UsersPage() {
  return (
    <>
      <PageHeader eyebrow="Gestión" title="Usuarios" />
      <EmptyState
        icon="users"
        title="Pantalla en construcción"
        message="El listado de usuarios se arma en la tarea T47."
      />
    </>
  );
}
