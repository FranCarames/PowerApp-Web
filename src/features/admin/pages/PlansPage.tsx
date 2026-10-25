import { PlanList } from '@/features/catalog/components/PlanList';
import { PageHeader } from '@/shared/ui';

/**
 * Planificaciones del Admin (CU-E-08): el listado compartido con el Entrenador (`PlanList`), bajo su
 * encabezado. Tocar una planificación abre su editor en `/a/planes/:id` (T24).
 */
export function PlansPage() {
  return (
    <>
      <PageHeader eyebrow="Sistémicas" title="Planificaciones" />
      <PlanList basePath="/a/planes" />
    </>
  );
}
