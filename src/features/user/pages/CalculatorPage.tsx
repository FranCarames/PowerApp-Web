import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T27): la calculadora de RM reemplaza esta pantalla.
export function CalculatorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Estimá tu máximo"
        title="Calculadora RM"
        back="/u/rms"
      />
      <EmptyState
        icon="calc"
        title="Pantalla en construcción"
        message="La calculadora de RM se arma en la tarea T27."
      />
    </>
  );
}
