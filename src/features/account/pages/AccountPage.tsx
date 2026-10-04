import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T13): el menú de Mi cuenta reemplaza esta pantalla.
export function AccountPage() {
  return (
    <>
      <PageHeader title="Mi cuenta" />
      <EmptyState
        icon="user"
        title="Pantalla en construcción"
        message="Mi cuenta se arma en la tarea T13."
      />
    </>
  );
}
