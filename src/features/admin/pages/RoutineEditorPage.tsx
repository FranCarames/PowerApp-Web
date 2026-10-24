import { useParams } from 'react-router';

import { RoutineEditor } from '@/features/catalog/components/RoutineEditor';

/** Alta y edición de una rutina (CU-E-16 a CU-E-18), en `/a/rutinas/nuevo` y `/a/rutinas/:id`. */
export function RoutineEditorPage() {
  const { id } = useParams();
  // La ruta siempre trae el id: `nuevo` para el alta.
  if (!id) return null;
  return (
    <RoutineEditor id={id} basePath="/a/rutinas" circuitsPath="/a/circuitos" />
  );
}
