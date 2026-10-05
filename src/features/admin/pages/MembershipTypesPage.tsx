import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T34): el listado de tipos de membresía reemplaza esta pantalla.
export function MembershipTypesPage() {
  return (
    <>
      <PageHeader eyebrow="Configuración" title="Tipos de membresía" />
      <EmptyState
        icon="wallet"
        title="Pantalla en construcción"
        message="El listado de tipos de membresía se arma en la tarea T34."
      />
    </>
  );
}
