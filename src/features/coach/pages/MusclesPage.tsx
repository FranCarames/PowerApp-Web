import { MusclesIndexPage } from '@/features/catalog/pages/MusclesIndexPage';

import { RoutinesSegments } from '../components/RoutinesSegments';

/**
 * El índice de músculos de la biblioteca del Entrenador (CU-E-30): el mismo del Usuario
 * (`MusclesIndexPage`), dentro del segmento Ejercicios del tab Rutinas.
 */
export function MusclesPage() {
  return (
    <MusclesIndexPage
      basePath="/c/ejercicios"
      nav={<RoutinesSegments value="ejercicios" />}
    />
  );
}
