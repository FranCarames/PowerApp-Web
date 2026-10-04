import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T29): el temporizador reemplaza esta pantalla.
export function TimerPage() {
  return (
    <>
      <PageHeader eyebrow="Descanso entre series" title="Temporizador" />
      <EmptyState
        icon="timer"
        title="Pantalla en construcción"
        message="El temporizador se arma en la tarea T29."
      />
    </>
  );
}
