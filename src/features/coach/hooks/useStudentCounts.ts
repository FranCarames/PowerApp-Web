import { useUserCount } from '@/features/account/hooks/useUserCount';

/**
 * Los contadores de Mis alumnos: activos, inactivos y el total, que es la suma de los dos. Cada uno
 * es `undefined` mientras carga o si no se pudo cargar.
 */
export function useStudentCounts() {
  const active = useUserCount({ role: 'user', active: true });
  const inactive = useUserCount({ role: 'user', active: false });

  return {
    active: active.data,
    inactive: inactive.data,
    total:
      active.data !== undefined && inactive.data !== undefined
        ? active.data + inactive.data
        : undefined,
    isPending: active.isPending || inactive.isPending,
  };
}
