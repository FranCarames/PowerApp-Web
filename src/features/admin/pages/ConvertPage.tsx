import { EmptyState, PageHeader } from '@/shared/ui';

// TEMPORAL (T36): convertir a un alumno en entrenador reemplaza esta pantalla. Desde Usuarios llega
// con el alumno elegido en `?alumno=<id>`.
export function ConvertPage() {
  return (
    <>
      <PageHeader
        eyebrow="Nuevo entrenador"
        title="Convertir alumno"
        back="/a/entrenadores"
      />
      <EmptyState
        icon="shield"
        title="Pantalla en construcción"
        message="Convertir un alumno en entrenador se arma en la tarea T36."
      />
    </>
  );
}
