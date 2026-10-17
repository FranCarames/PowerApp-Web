import { RoutineList } from '@/features/catalog/components/RoutineList';
import { PageHeader } from '@/shared/ui';

/**
 * Rutinas del Admin (CU-E-15): el listado compartido con el Entrenador (`RoutineList`), bajo su
 * encabezado. Tocar una rutina abre su editor en `/a/rutinas/:id` (T22).
 */
export function RoutinesPage() {
  return (
    <>
      <PageHeader eyebrow="Sistémicas" title="Rutinas" />
      <RoutineList basePath="/a/rutinas" />
    </>
  );
}
