import { RoutineList } from '@/features/catalog/components/RoutineList';
import { PageHeader } from '@/shared/ui';

import { RoutinesSegments } from '../components/RoutinesSegments';

/**
 * Rutinas del Entrenador (CU-E-15), el primer segmento del tab Rutinas: el listado compartido con el
 * Admin (`RoutineList`). Tocar una rutina abre su editor en `/c/rutinas/:id`.
 */
export function RoutinesPage() {
  return (
    <>
      <PageHeader eyebrow="Sistémicas" title="Rutinas" />
      <RoutinesSegments value="rutinas" />
      <RoutineList basePath="/c/rutinas" />
    </>
  );
}
