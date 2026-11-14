import { useNavigate, useParams } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import {
  Button,
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageHeader,
} from '@/shared/ui';

import { MuscleSheet } from '../components/MuscleSheet';
import { useHistoryBack } from '../hooks/useHistoryBack';
import { useMuscles } from '../hooks/useMuscles';

interface MusclePageProps {
  /** De dónde cuelga la biblioteca: `/u/wiki` (Usuario) o `/c/ejercicios` (Entrenador). */
  basePath: string;
}

/**
 * La página de un músculo de la biblioteca, solo de lectura (CU-U-15 y CU-E-30), en
 * `<basePath>/musculos/:id`. Se llega desde los músculos de un ejercicio (la ficha o la rutina) o
 * desde el índice de músculos.
 */
export function MusclePage({ basePath }: MusclePageProps) {
  const { id } = useParams();
  // La ruta siempre trae el id.
  if (!id) return null;
  return <Muscle id={id} basePath={basePath} />;
}

function Muscle({ id, basePath }: { id: string; basePath: string }) {
  const navigate = useNavigate();
  // Desde un ejercicio o el índice, "Volver" regresa ahí; con un link directo, va al índice.
  const onBack = useHistoryBack();
  // El músculo sale de `GET /muscles/all`, que ya está en caché si se vino de la biblioteca.
  const query = useMuscles();
  const muscle = query.data?.find((item) => item.id === id);

  let content;
  if (muscle) {
    content = <MuscleSheet muscle={muscle} basePath={basePath} />;
  } else if (query.data) {
    content = (
      <EmptyState
        icon="search"
        title="Este músculo ya no existe"
        message="Puede que lo hayan sacado del catálogo."
        action={
          <Button sm variant="sec" onClick={() => void navigate(basePath)}>
            Ir a la biblioteca
          </Button>
        }
      />
    );
  } else if (query.isError) {
    content = (
      <ErrorState
        message={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  } else {
    // <ListSkeleton> ya avisa "Cargando…" a los lectores de pantalla.
    content = <ListSkeleton columns={2} rows={4} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Músculo"
        title={muscle?.name ?? 'Músculo'}
        back={`${basePath}/musculos`}
        onBack={onBack}
      />
      {content}
    </>
  );
}
