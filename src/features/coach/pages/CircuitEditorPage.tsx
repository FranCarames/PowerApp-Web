import { useParams } from 'react-router';

import { CircuitEditor } from '@/features/catalog/components/CircuitEditor';

/** Alta y edición de un circuito (CU-E-22 a CU-E-24), en `/c/circuitos/nuevo` y `/c/circuitos/:id`. */
export function CircuitEditorPage() {
  const { id } = useParams();
  // La ruta siempre trae el id: `nuevo` para el alta.
  if (!id) return null;
  return <CircuitEditor id={id} basePath="/c/circuitos" />;
}
