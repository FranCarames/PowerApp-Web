import { SectionPlaceholder } from '@/shared/ui';

import { RoutinesSegments } from '../components/RoutinesSegments';

// PLACEHOLDER hasta el bloque C2: T21 (listado de rutinas) reemplaza el aviso. El segmento Circuitos ya anda (T48).
export function RoutinesPage() {
  return (
    <SectionPlaceholder eyebrow="Sistémicas" title="Rutinas" icon="list">
      <RoutinesSegments value="rutinas" />
    </SectionPlaceholder>
  );
}
