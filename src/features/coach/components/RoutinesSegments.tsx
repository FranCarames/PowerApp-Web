import { useNavigate } from 'react-router';

import { Segmented } from '@/shared/ui';

/**
 * Los segmentos Rutinas, Circuitos y Ejercicios del tab Rutinas del Entrenador. Cada uno es una ruta
 * (`/c/rutinas`, `/c/circuitos` y `/c/ejercicios`), así que el editor de un circuito
 * (`/c/circuitos/:id`) y la ficha de un ejercicio (`/c/ejercicios/:id`) cuelgan de la suya y la tab
 * sigue marcada.
 */
export function RoutinesSegments({
  value,
}: {
  value: 'rutinas' | 'circuitos' | 'ejercicios';
}) {
  const navigate = useNavigate();

  return (
    <Segmented
      label="Ver rutinas, circuitos o ejercicios"
      value={value}
      options={[
        { value: 'rutinas', label: 'Rutinas' },
        { value: 'circuitos', label: 'Circuitos' },
        { value: 'ejercicios', label: 'Ejercicios' },
      ]}
      onChange={(next) => navigate(`/c/${next}`, { replace: true })}
    />
  );
}
