import { useLocation, useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import { ErrorState, PageHeader } from '@/shared/ui';

import { ExerciseSheet } from '../components/ExerciseSheet';
import { ExerciseSheetSkeleton } from '../components/ExerciseSheetSkeleton';
import { useExercise } from '../hooks/useExercises';
import { useHistoryBack } from '../hooks/useHistoryBack';
import { wikiListSearch } from '../wikiState';

interface WikiExercisePageProps {
  /** La lista de la biblioteca, adonde vuelve "Volver": `/u/wiki` (Usuario) o `/c/ejercicios` (Entrenador). */
  basePath: string;
}

/**
 * Ficha de un ejercicio de la biblioteca, solo de lectura (CU-U-15 y CU-E-30), en `<basePath>/:id`.
 */
export function WikiExercisePage({ basePath }: WikiExercisePageProps) {
  const { id } = useParams();
  // La ruta siempre trae el id.
  if (!id) return null;
  return <WikiExercise id={id} basePath={basePath} />;
}

function WikiExercise({ id, basePath }: { id: string; basePath: string }) {
  const { state } = useLocation();
  // Abierta desde la página de un músculo, "Volver" regresa a ella.
  const onBack = useHistoryBack();
  // Abre al instante con lo que la lista ya trajo y confirma con `GET /exercise/{id}`.
  const query = useExercise(id, { placeholderFromList: true });
  const exercise = query.data;
  // Un id que no existe da 404 y uno que no es un UUID, 400: en los dos casos reintentar no sirve.
  const notFound =
    isApiError(query.error) &&
    (query.error.status === 404 || query.error.status === 400);

  return (
    <>
      <PageHeader
        eyebrow="Biblioteca"
        title={exercise?.name ?? 'Ejercicio'}
        back={{ pathname: basePath, search: wikiListSearch(state) }}
        onBack={onBack}
      />
      {exercise ? (
        <ExerciseSheet
          exercise={exercise}
          musclesPath={`${basePath}/musculos`}
        />
      ) : query.isError ? (
        <ErrorState
          title={notFound ? 'No encontramos el ejercicio' : undefined}
          message={
            notFound
              ? 'Puede que ya no esté en la biblioteca. Volvé a la lista.'
              : getErrorMessage(query.error)
          }
          onRetry={notFound ? undefined : () => void query.refetch()}
          retrying={query.isRefetching}
        />
      ) : (
        <ExerciseSheetSkeleton />
      )}
    </>
  );
}
