import { WikiPage } from '@/features/catalog/pages/WikiPage';

import { RoutinesSegments } from '../components/RoutinesSegments';

/**
 * Biblioteca de ejercicios del Entrenador (CU-E-30), el tercer segmento del tab Rutinas: la misma
 * wiki del Usuario (`WikiPage`), solo de lectura. Tocar un ejercicio abre su ficha en
 * `/c/ejercicios/:id`. Sin "Volver": se llega desde los segmentos, como a Circuitos.
 */
export function ExercisesPage() {
  return (
    <WikiPage
      basePath="/c/ejercicios"
      nav={<RoutinesSegments value="ejercicios" />}
    />
  );
}
