import { useNavigate } from 'react-router';

import { Segmented } from '@/shared/ui';

interface LibrarySegmentsProps {
  /** De dónde cuelga la biblioteca: `/u/wiki` (Usuario) o `/c/ejercicios` (Entrenador). */
  basePath: string;
  value: 'ejercicios' | 'musculos';
}

/**
 * Los segmentos de la biblioteca: los ejercicios (`<basePath>`) o los músculos por grupo
 * (`<basePath>/musculos`). Cada uno es una ruta.
 */
export function LibrarySegments({ basePath, value }: LibrarySegmentsProps) {
  const navigate = useNavigate();

  return (
    <Segmented
      label="Ver ejercicios o músculos"
      value={value}
      options={[
        { value: 'ejercicios', label: 'Ejercicios' },
        { value: 'musculos', label: 'Músculos' },
      ]}
      onChange={(next) =>
        void navigate(next === 'musculos' ? `${basePath}/musculos` : basePath, {
          replace: true,
        })
      }
    />
  );
}
