import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T11): el formulario de recuperación reemplaza esta pantalla.
export function RecoverPage() {
  return (
    <>
      <PageHeader title="Recuperar acceso" back="/login" />
      <EmptyState
        icon="key"
        title="Pantalla en construcción"
        message="Recuperar la contraseña se arma en la tarea T11."
      />
    </>
  );
}
