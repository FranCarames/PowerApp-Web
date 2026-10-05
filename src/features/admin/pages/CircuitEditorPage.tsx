import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T20): el editor de circuito reemplaza esta pantalla.
export function CircuitEditorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Entrenamiento"
        title="Circuito"
        back="/a/circuitos"
      />
      <EmptyState
        icon="cycle"
        title="Pantalla en construcción"
        message="El editor de circuito se arma en la tarea T20."
      />
    </>
  );
}
