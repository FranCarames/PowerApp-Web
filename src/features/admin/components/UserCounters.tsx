import { useUserCount } from '@/features/account/hooks/useUserCount';
import { Skeleton, Stat, StatGrid } from '@/shared/ui';

/** Un contador que todavía no llegó se reserva con un bloque de carga, y uno que falló queda en "–". */
function count(value: number | undefined, pending: boolean) {
  if (value !== undefined) return value;
  return pending ? <Skeleton width={28} height={22} radius={6} /> : '–';
}

/**
 * Alumnos, entrenadores e inactivos (de cualquier rol), tomados del `total` del backend. Son de todos
 * los usuarios: la búsqueda y el chip de la lista no los cambian.
 */
export function UserCounters() {
  const students = useUserCount({ role: 'user' });
  const coaches = useUserCount({ role: 'coach' });
  const inactive = useUserCount({ active: false });

  return (
    <StatGrid>
      <Stat
        tone="pri"
        value={count(students.data, students.isPending)}
        label="Alumnos"
      />
      <Stat
        tone="acc"
        value={count(coaches.data, coaches.isPending)}
        label="Entrenadores"
      />
      <Stat
        tone="warn"
        value={count(inactive.data, inactive.isPending)}
        label="Inactivos"
      />
    </StatGrid>
  );
}
