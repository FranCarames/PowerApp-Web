import { useAuth } from '@/features/auth/hooks/useAuth';
import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T15): Mis alumnos reemplaza esta pantalla.
export function StudentsPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader eyebrow={`Coach ${user?.first_name}`} title="Mis alumnos" />
      <EmptyState
        icon="users"
        title="Pantalla en construcción"
        message="Mis alumnos se arma en la tarea T15."
      />
    </>
  );
}
