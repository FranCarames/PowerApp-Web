import { useLocation, useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import { useExercise } from '@/features/catalog/hooks/useExercises';
import { ErrorState, PageHeader } from '@/shared/ui';

import { ExerciseSheet } from '../components/ExerciseSheet';
import { ExerciseSheetSkeleton } from '../components/ExerciseSheetSkeleton';
import { wikiListSearch } from '../wikiState';

/** Ficha de un ejercicio de la wiki (CU-U-15), en `/u/wiki/:id`. */
export function WikiExercisePage() {
  const { id } = useParams();
  // La ruta siempre trae el id.
  if (!id) return null;
  return <WikiExercise id={id} />;
}

function WikiExercise({ id }: { id: string }) {
  const { state } = useLocation();
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
        back={{ pathname: '/u/wiki', search: wikiListSearch(state) }}
      />
      {exercise ? (
        <ExerciseSheet exercise={exercise} />
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
