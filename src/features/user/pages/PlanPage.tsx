import { useAuth } from '@/features/auth/hooks/useAuth';
import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T38): el home semanal reemplaza esta pantalla.
export function PlanPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader eyebrow={`Hola, ${user?.first_name} 👋`} title="Tu plan" />
      <EmptyState
        icon="dumbbell"
        title="Pantalla en construcción"
        message="El home semanal se arma en la tarea T38."
      />
    </>
  );
}
