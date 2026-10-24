import { useLocation } from 'react-router';

import { EmptyState, PageHeader } from '@/shared/ui';

import { homeBackTo } from '../homeState';

// TEMPORAL (T39): el detalle de la rutina reemplaza esta pantalla. Las dos rutas que la usan son
// `/u/rutina/:id` (una rutina individual) y `/u/rutina/plan/:userPlanificationId/:routineAsignationId`
// (una rutina de una semana del plan): las abre el home.
export function RoutineDetailPage() {
  const { state } = useLocation();

  return (
    <>
      <PageHeader
        eyebrow="Rutina"
        title="Detalle de la rutina"
        back={homeBackTo(state)}
      />
      <EmptyState
        icon="dumbbell"
        title="Pantalla en construcción"
        message="El detalle de la rutina se arma en la tarea T39."
      />
    </>
  );
}
