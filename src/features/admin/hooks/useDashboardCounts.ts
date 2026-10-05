import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useUserCount } from '@/features/account/hooks/useUserCount';

// Los números del panel del Admin. Cada uno es una query con su `select`: el panel no necesita las
// listas, solo cuántos hay. Las listas completas las piden después las pantallas de cada sección (con
// la misma query key, así que comparten el caché).

/** `GET /exercise/all`: cuántos ejercicios tiene el catálogo. */
function useExerciseCount() {
  return useQuery({
    queryKey: queryKeys.exercises.list(),
    queryFn: ({ signal }) => api.get('/api/v1/exercise/all', { signal }),
    select: (exercises) => exercises.length,
  });
}

/** `GET /routine/circuit/all`: los circuitos activos (sin `include_inactive`, el backend deja afuera los dados de baja). */
function useActiveCircuitCount() {
  return useQuery({
    queryKey: queryKeys.routines.circuits(),
    queryFn: ({ signal }) => api.get('/api/v1/routine/circuit/all', { signal }),
    select: (circuits) => circuits.filter((circuit) => circuit.active).length,
  });
}

/** `GET /routine/all`: las rutinas activas (sin `include_inactive`, el backend deja afuera las dadas de baja). */
function useRoutineCount() {
  return useQuery({
    queryKey: queryKeys.routines.list(),
    queryFn: ({ signal }) => api.get('/api/v1/routine/all', { signal }),
    select: (routines) => routines.filter((routine) => routine.active).length,
  });
}

/** `GET /planification/all`: las planificaciones sistémicas activas (el backend deja afuera las dadas de baja). */
function usePlanificationCount() {
  return useQuery({
    queryKey: queryKeys.planifications.list(),
    queryFn: ({ signal }) => api.get('/api/v1/planification/all', { signal }),
    select: (plans) => plans.filter((plan) => plan.active).length,
  });
}

/** `GET /coach/all`: cuántos entrenadores tienen la cuenta activa. */
function useActiveCoachCount() {
  return useQuery({
    queryKey: queryKeys.coaches.list(),
    queryFn: ({ signal }) => api.get('/api/v1/coach/all', { signal }),
    select: (coaches) => coaches.filter((coach) => coach.active).length,
  });
}

/**
 * Los seis números del panel, cada uno con su propio estado de carga: un endpoint que falla deja en
 * "–" solo a su tarjeta. `retry` vuelve a pedir únicamente los que fallaron.
 */
export function useDashboardCounts() {
  // Cuántos usuarios hay, de cualquier rol.
  const users = useUserCount();
  const exercises = useExerciseCount();
  const circuits = useActiveCircuitCount();
  const routines = useRoutineCount();
  const plans = usePlanificationCount();
  const coaches = useActiveCoachCount();

  const failed = [users, exercises, circuits, routines, plans, coaches].filter(
    (query) => query.isError,
  );

  return {
    users,
    exercises,
    circuits,
    routines,
    plans,
    coaches,
    hasError: failed.length > 0,
    retrying: failed.some((query) => query.isFetching),
    retry: () => failed.forEach((query) => void query.refetch()),
  };
}
