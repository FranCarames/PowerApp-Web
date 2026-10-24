import { useNavigate, useParams } from 'react-router';

import { RoutineEditor } from '@/features/catalog/components/RoutineEditor';

/**
 * Alta y edición de una rutina (CU-E-16 a CU-E-18), en `/c/rutinas/nuevo` y `/c/rutinas/:id`. Los
 * circuitos de la rutina se editan en `/c/circuitos`, y "Asignar a alumno" lleva a
 * `/c/rutinas/:id/asignar` (hoy un placeholder hasta T42).
 */
export function RoutineEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // La ruta siempre trae el id: `nuevo` para el alta.
  if (!id) return null;
  return (
    <RoutineEditor
      id={id}
      basePath="/c/rutinas"
      circuitsPath="/c/circuitos"
      onAssign={(routineId) => navigate(`/c/rutinas/${routineId}/asignar`)}
    />
  );
}
