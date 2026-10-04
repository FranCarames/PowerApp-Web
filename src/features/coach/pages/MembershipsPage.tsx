import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T17): el control de membresías reemplaza esta pantalla.
export function MembershipsPage() {
  return (
    <>
      <PageHeader eyebrow="Organización" title="Membresías" back="/c/alumnos" />
      <EmptyState
        icon="wallet"
        title="Pantalla en construcción"
        message="El control de membresías se arma en la tarea T17."
      />
    </>
  );
}
