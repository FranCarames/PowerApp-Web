import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T31): el catálogo de ejercicios reemplaza esta pantalla.
export function ExercisesPage() {
  return (
    <>
      <PageHeader eyebrow="Entrenamiento" title="Ejercicios" />
      <EmptyState
        icon="dumbbell"
        title="Pantalla en construcción"
        message="El catálogo de ejercicios se arma en la tarea T31."
      />
    </>
  );
}
