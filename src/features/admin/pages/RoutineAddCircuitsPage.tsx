import { useParams } from 'react-router';

import { RoutineAddCircuits } from '@/features/catalog/components/RoutineAddCircuits';

/** «Agregar circuitos» a una rutina (CU-E-16 y CU-E-17), en `/a/rutinas/:id/agregar-circuitos` (`:id` puede ser `nuevo`). */
export function RoutineAddCircuitsPage() {
  const { id } = useParams();
  if (!id) return null;
  return <RoutineAddCircuits id={id} basePath="/a/rutinas" />;
}
