import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T12): el formulario de cambio de contraseña reemplaza esta pantalla.
export function ChangePasswordPage() {
  return (
    <>
      <PageHeader title="Nueva contraseña" />
      <EmptyState
        icon="key"
        title="Pantalla en construcción"
        message="Cambiar la contraseña se arma en la tarea T12."
      />
    </>
  );
}
