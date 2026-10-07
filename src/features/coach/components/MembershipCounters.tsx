import { Skeleton, Stat, StatGrid } from '@/shared/ui';

import { useMembershipSummary } from '../hooks/useMembershipSummary';

/** Un contador que todavía no llegó se reserva con un bloque de carga, y uno que falló queda en "–". */
function count(value: number | undefined, pending: boolean) {
  if (value !== undefined) return value;
  return pending ? <Skeleton width={28} height={22} radius={6} /> : '–';
}

/**
 * Los alumnos en cada estado de membresía (CU-E-26): activas, por vencer, vencidas y sin pagos, de
 * `GET /membership/status/summary`. Son de todos los alumnos, también de los de cuenta inactiva (así
 * los cuenta el backend), y la búsqueda y los filtros de la lista no los cambian. El prototipo tiene
 * tres estados; "Sin pagos" se suma porque la API lo informa.
 */
export function MembershipCounters() {
  const { data, isPending } = useMembershipSummary();
  const counts = data?.counts;

  return (
    <StatGrid columns={4}>
      <Stat
        tone="ok"
        tinted
        value={count(counts?.active, isPending)}
        label="Activas"
      />
      <Stat
        tone="warn"
        tinted
        value={count(counts?.expiring_soon, isPending)}
        label="Por vencer"
      />
      <Stat
        tone="err"
        tinted
        value={count(counts?.expired, isPending)}
        label="Vencidas"
      />
      <Stat value={count(counts?.no_payments, isPending)} label="Sin pagos" />
    </StatGrid>
  );
}
