import { useNavigate } from 'react-router';

import { Segmented } from '@/shared/ui';

/**
 * Los segmentos Rutinas y Circuitos del tab Rutinas del Entrenador. Cada uno es una ruta
 * (`/c/rutinas` y `/c/circuitos`), así que el editor de un circuito (`/c/circuitos/:id`) cuelga
 * del segundo y la tab sigue marcada.
 */
export function RoutinesSegments({
  value,
}: {
  value: 'rutinas' | 'circuitos';
}) {
  const navigate = useNavigate();

  return (
    <Segmented
      label="Ver rutinas o circuitos"
      value={value}
      options={[
        { value: 'rutinas', label: 'Rutinas' },
        { value: 'circuitos', label: 'Circuitos' },
      ]}
      onChange={(next) => navigate(`/c/${next}`, { replace: true })}
    />
  );
}
