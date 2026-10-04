import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T10): el formulario de registro reemplaza esta pantalla.
export function RegisterPage() {
  return (
    <>
      <PageHeader title="Crear cuenta" back="/login" />
      <EmptyState
        icon="user"
        title="Pantalla en construcción"
        message="El registro se arma en la tarea T10."
      />
    </>
  );
}
