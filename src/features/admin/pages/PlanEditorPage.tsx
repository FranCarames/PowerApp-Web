import { useParams } from 'react-router';

import { PlanEditor } from '@/features/catalog/components/PlanEditor';

/** Alta y edición de una planificación (CU-E-09 a CU-E-12), en `/a/planes/nuevo` y `/a/planes/:id`. */
export function PlanEditorPage() {
  const { id } = useParams();
  // La ruta siempre trae el id: `nuevo` para el alta.
  if (!id) return null;
  return <PlanEditor id={id} basePath="/a/planes" />;
}
