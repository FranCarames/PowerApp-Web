import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T18): el registro de pagos reemplaza esta pantalla. El detalle del alumno (T16) llega acá
// con `?alumno=<id>`, que T18 usa para preseleccionarlo.
export function RegisterPaymentPage() {
  return (
    <>
      <PageHeader
        eyebrow="Membresías"
        title="Registrar pago"
        back="/c/membresias"
      />
      <EmptyState
        icon="wallet"
        title="Pantalla en construcción"
        message="El registro de pagos se arma en la tarea T18."
      />
    </>
  );
}
