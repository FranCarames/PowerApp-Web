import { useParams } from 'react-router';

import { RESTORE_DRAFT_STATE } from '@/features/catalog/routineDraft';
import { SectionPlaceholder } from '@/shared/ui';

// PLACEHOLDER hasta T42 (asignar una rutina a un alumno, CU-E-19): "Asignar a alumno" del editor de rutina llega acá.
export function AssignRoutinePage() {
  const { id } = useParams();

  return (
    <SectionPlaceholder
      eyebrow="Rutina"
      title="Asignar a alumno"
      icon="list"
      // El editor guardó lo escrito antes de salir: al volver lo recupera.
      back={`/c/rutinas/${id}`}
      backState={RESTORE_DRAFT_STATE}
      message="Asignar una rutina a un alumno todavía no está disponible."
    />
  );
}
