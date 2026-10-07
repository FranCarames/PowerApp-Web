import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
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

import { useCircuits, useCircuitUsage } from '../hooks/useCircuits';
import { CircuitCard } from './CircuitCard';

/** Los chips, con el valor que llevan en la URL y qué circuitos muestran (los vigentes son los de siempre). */
const FILTERS = [
  { label: 'Activos', param: null, show: (active: boolean) => active },
  {
    label: 'Inactivos',
    param: 'inactivos',
    show: (active: boolean) => !active,
  },
  { label: 'Todos', param: 'todos', show: () => true },
] as const;

/**
 * Los circuitos (CU-E-21), el mismo listado del Admin y del Entrenador: el nombre, el tipo, los
 * ejercicios y en cuántas rutinas se usa cada uno, con búsqueda y los chips Activos, Inactivos y
 * Todos, y el botón para crear uno. Tocar un circuito abre su editor (CU-E-22 a CU-E-24), donde
 * también se lo da de baja o se lo reactiva. La búsqueda y el chip quedan en la URL
 * (`?q=…&filtro=inactivos`). Va debajo del encabezado de cada pantalla.
 *
 * `basePath` es la ruta de los circuitos del rol (`/a/circuitos` o `/c/circuitos`): el editor cuelga
 * de ahí (`<basePath>/<id>` y `<basePath>/nuevo`).
 */
export function CircuitList({ basePath }: { basePath: string }) {
  const navigate = useNavigate();
  const { search, setSearch, filter, setFilter } = useSearchAndFilter(
    'filtro',
    ['inactivos', 'todos'],
  );
  const selected = FILTERS.find(({ param }) => param === filter) ?? FILTERS[0];
  // Una sola lista con los de baja incluidos: los chips filtran sin volver a pedirla.
  const circuits = useCircuits({ includeInactive: true });
  // En cuántas rutinas se usa cada uno. Si no llega, las tarjetas no lo dicen.
  const usage = useCircuitUsage();

  const visible = circuits.data
    ?.filter(
      (circuit) =>
        selected.show(circuit.active) && matchesSearch(circuit.name, search),
    )
    // Los vigentes primero (el backend ya los ordena por nombre).
    .sort((a, b) => Number(b.active) - Number(a.active));

  return (
    <>
      <SearchInput
        placeholder="Buscar circuito"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup aria-label="Filtrar circuitos">
        {FILTERS.map(({ label, param }) => (
          <Chip
            key={label}
            selected={param === selected.param}
            onClick={() => setFilter(param)}
          >
            {label}
          </Chip>
        ))}
      </ChipGroup>
      {visible ? (
        visible.length === 0 ? (
          circuits.data?.length === 0 ? (
            <EmptyState
              icon="cycle"
              title="Todavía no hay circuitos"
              message="Creá el primero para poder armar rutinas."
              action={
                <Button sm onClick={() => navigate(`${basePath}/nuevo`)}>
                  Crear circuito
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="search"
              title="Sin coincidencias"
              message="No hay circuitos con ese filtro."
            />
          )
        ) : (
          <List columns={2}>
            {visible.map((circuit) => (
              <CircuitCard
                key={circuit.id}
                circuit={circuit}
                // Un circuito sin rutinas no figura en el conteo: son cero, si el conteo llegó.
                routines={
                  usage.data
                    ? (usage.data.get(circuit.id)?.length ?? 0)
                    : undefined
                }
                onOpen={({ id }) => navigate(`${basePath}/${id}`)}
              />
            ))}
          </List>
        )
      ) : circuits.isError ? (
        <ErrorState
          message={getErrorMessage(circuits.error)}
          onRetry={() => void circuits.refetch()}
          retrying={circuits.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={4} />
      )}
      <Fab
        label="Crear circuito"
        onClick={() => navigate(`${basePath}/nuevo`)}
      />
    </>
  );
}
