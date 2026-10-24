import { useParams } from 'react-router';

import { SectionPlaceholder } from '@/shared/ui';

// PLACEHOLDER hasta T41 (asignar una planificación a un alumno, CU-E-13): "Asignar" del listado de planificaciones llega acá.
export function AssignPlanPage() {
  const { id } = useParams();

  return (
    <SectionPlaceholder
      eyebrow="Planificación"
      title="Asignar a alumnos"
      icon="calendar"
      back={`/c/planes/${id}`}
      message="Asignar una planificación a un alumno todavía no está disponible."
    />
  );
}
