import { useMemo } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { RoutineListItemPlus } from '@/api/types';
import { matchesSearch } from '@/shared/lib/text';
import {
  KEYWORD_MAX_LENGTH,
  useSearchAndFilter,
} from '@/shared/lib/useSearchAndFilter';
import {
  Button,
  Chip,
  ChipGroup,
  EmptyState,
  ErrorState,
  Fab,
  List,
  ListSkeleton,
  SearchInput,
} from '@/shared/ui';

import { useCircuits } from '../hooks/useCircuits';
import { useRoutines } from '../hooks/useRoutines';
import { RoutineCard } from './RoutineCard';

/** El valor del chip "Incluir inactivas" en la URL. */
const INACTIVE_PARAM = 'inactivas';

/**
 * Cuántos ejercicios suman los circuitos de una rutina. Un circuito que se repite en la rutina cuenta
 * cada vez que aparece, como el prototipo. Si falta alguno en `exercisesByCircuit`, no se sabe.
 */
function countExercises(
  routine: RoutineListItemPlus,
  exercisesByCircuit: Map<string, number> | undefined,
): number | undefined {
  if (!exercisesByCircuit) return undefined;
  let total = 0;
  for (const { circuit } of routine.circuits) {
    const count = exercisesByCircuit.get(circuit.id);
    if (count === undefined) return undefined;
    total += count;
  }
  return total;
}

/**
 * Las rutinas (CU-E-15), el mismo listado del Admin y del Entrenador: el nombre, la nota del
 * entrenador y cuántos ejercicios y circuitos tiene cada una, con búsqueda, el chip "Incluir inactivas"
 * y el botón para crear una. Tocar una rutina abre su editor (CU-E-16 a CU-E-18), donde también se la
 * da de baja o se la reactiva. La búsqueda y el chip quedan en la URL (`?q=…&filtro=inactivas`). Va
 * debajo del encabezado de cada pantalla.
 *
 * `basePath` es la ruta de las rutinas del rol (`/a/rutinas` o `/c/rutinas`): el editor cuelga de ahí
 * (`<basePath>/<id>` y `<basePath>/nuevo`).
 */
export function RoutineList({ basePath }: { basePath: string }) {
  const navigate = useNavigate();
  const { search, setSearch, filter, setFilter } = useSearchAndFilter(
    'filtro',
    [INACTIVE_PARAM],
  );
  const includeInactive = filter === INACTIVE_PARAM;
  // Una sola lista con las de baja incluidas: el chip filtra sin volver a pedirla.
  const routines = useRoutines({ includeInactive: true });
  // `all-plus` no trae los ejercicios de las rutinas: se cuentan con los de cada circuito. Si no llega,
  // las tarjetas cuentan solo los circuitos.
  const circuits = useCircuits({ includeInactive: true });
  const exercisesByCircuit = useMemo(
    () =>
      circuits.data &&
      new Map(
        circuits.data.map(({ id, exercise_count }) => [id, exercise_count]),
      ),
    [circuits.data],
  );

  // La búsqueda mira el nombre y la nota del entrenador, como el `keyword` del backend.
  const matches = (routine: RoutineListItemPlus) =>
    matchesSearch(routine.name, search) ||
    matchesSearch(routine.coach_note ?? '', search);
  const visible = routines.data
    ?.filter(
      (routine) => (includeInactive || routine.active) && matches(routine),
    )
    // Las vigentes primero (el backend ya las ordena por nombre).
    .sort((a, b) => Number(b.active) - Number(a.active));
  // Con el chip apagado quedan afuera las dadas de baja: si por eso no se ve nada, el vacío lo dice.
  const hiddenInactive =
    !includeInactive &&
    routines.data?.some((routine) => !routine.active && matches(routine));

  return (
    <>
      <SearchInput
        placeholder="Buscar rutina"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup aria-label="Filtrar rutinas">
        <Chip
          selected={includeInactive}
          onClick={() => setFilter(includeInactive ? null : INACTIVE_PARAM)}
        >
          Incluir inactivas
        </Chip>
      </ChipGroup>
      {visible ? (
        visible.length === 0 ? (
          routines.data?.length === 0 ? (
            <EmptyState
              icon="list"
              title="Todavía no hay rutinas"
              message="Creá la primera para armar planificaciones."
              action={
                <Button sm onClick={() => navigate(`${basePath}/nuevo`)}>
                  Crear rutina
                </Button>
              }
            />
          ) : hiddenInactive && !search.trim() ? (
            <EmptyState
              icon="list"
              title="No hay rutinas activas"
              message="Todas están dadas de baja. Activá “Incluir inactivas” para verlas."
            />
          ) : (
            <EmptyState
              icon="search"
              title="Sin coincidencias"
              message={
                hiddenInactive
                  ? 'No encontramos rutinas activas con esa búsqueda. Activá “Incluir inactivas” para ver también las dadas de baja.'
                  : 'No encontramos rutinas con esa búsqueda.'
              }
            />
          )
        ) : (
          <List columns={2}>
            {visible.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                exercises={countExercises(routine, exercisesByCircuit)}
                onOpen={({ id }) => navigate(`${basePath}/${id}`)}
              />
            ))}
          </List>
        )
      ) : routines.isError ? (
        <ErrorState
          message={getErrorMessage(routines.error)}
          onRetry={() => void routines.refetch()}
          retrying={routines.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={4} />
      )}
      <Fab label="Crear rutina" onClick={() => navigate(`${basePath}/nuevo`)} />
    </>
  );
}
