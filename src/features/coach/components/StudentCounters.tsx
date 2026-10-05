import { Skeleton, Stat, StatGrid } from '@/shared/ui';

import { useStudentCounts } from '../hooks/useStudentCounts';

/** Un contador que todavía no llegó se reserva con un bloque de carga, y uno que falló queda en "–". */
function count(value: number | undefined, pending: boolean) {
  if (value !== undefined) return value;
  return pending ? <Skeleton width={28} height={22} radius={6} /> : '–';
}

/**
 * Activos, inactivos y total de alumnos, según el estado de la cuenta. Son de todos los alumnos: la
 * búsqueda y el filtro de la lista no los cambian.
 */
export function StudentCounters() {
  const counts = useStudentCounts();

  return (
    <StatGrid>
      <Stat
        tone="ok"
        value={count(counts.active, counts.isPending)}
        label="Activos"
      />
      <Stat
        tone="warn"
        value={count(counts.inactive, counts.isPending)}
        label="Inactivos"
      />
      <Stat
        tone="acc"
        value={count(counts.total, counts.isPending)}
        label="Total"
      />
    </StatGrid>
  );
}
