import { useNavigate } from 'react-router';

import { PlanList } from '@/features/catalog/components/PlanList';
import { PageHeader } from '@/shared/ui';

/**
 * Planificaciones del Entrenador (CU-E-08): el listado compartido con el Admin (`PlanList`), bajo su
 * encabezado. Tocar una planificación abre su editor en `/c/planes/:id` y "Asignar" lleva a asignarla
 * a un alumno (`/c/planes/:id/asignar`, hoy un placeholder hasta T41).
 */
export function PlansPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader eyebrow="Sistémicas" title="Planificaciones" />
      <PlanList
        basePath="/c/planes"
        onAssign={({ id }) => navigate(`/c/planes/${id}/asignar`)}
      />
    </>
  );
}
