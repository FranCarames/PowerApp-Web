import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { PlanificationListItem } from '@/api/types';
import { capitalize, matchesSearch } from '@/shared/lib/text';
import {
  KEYWORD_MAX_LENGTH,
  useSearchAndFilter,
  useUrlFlag,
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

import { usePlanifications } from '../hooks/usePlanifications';
import { PlanCard } from './PlanCard';

/** El tipo para comparar: "Fuerza" y "fuerza " son el mismo, como en el filtro del backend. */
function typeKey(plan: PlanificationListItem): string | null {
  return plan.type?.trim().toLowerCase() || null;
}

/** Los tipos que hay en las planificaciones, sin repetir y por orden alfabético: uno por chip. */
function typesOf(
  plans: PlanificationListItem[],
): Array<{ key: string; label: string }> {
  const types = new Map<string, string>();
  for (const plan of plans) {
    const key = typeKey(plan);
    if (key && !types.has(key)) types.set(key, capitalize(key));
  }
  return [...types]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

/**
 * Las planificaciones sistémicas (CU-E-08), el mismo listado del Admin y del Entrenador: el nombre, la
 * duración, el tipo y las rutinas asignadas de las previstas, con búsqueda (por nombre y descripción,
 * como el `keyword` del backend), un chip por cada tipo que haya, el chip "Incluir inactivas" y el
 * botón para crear una. Tocar una planificación abre su editor (CU-E-09 a CU-E-12), donde también se
 * la da de baja o se la reactiva. La búsqueda, el tipo y el chip quedan en la URL
 * (`?q=…&tipo=fuerza&inactivas=1`). Va debajo del encabezado de cada pantalla.
 *
 * `basePath` es la ruta de las planificaciones del rol (`/a/planes` o `/c/planes`): el editor cuelga
 * de ahí (`<basePath>/<id>` y `<basePath>/nuevo`). `onAssign` es del Entrenador: con él, cada
 * planificación vigente tiene su botón "Asignar" (CU-E-13).
 */
export function PlanList({
  basePath,
  onAssign,
}: {
  basePath: string;
  onAssign?: (plan: PlanificationListItem) => void;
}) {
  const navigate = useNavigate();
  const {
    search,
    setSearch,
    filter: typeParam,
    setFilter: setType,
  } = useSearchAndFilter('tipo');
  const [includeInactive, setIncludeInactive] = useUrlFlag('inactivas');
  // Una sola lista con las de baja incluidas: el chip y los tipos filtran sin volver a pedirla.
  const plans = usePlanifications({ includeInactive: true });

  const shown = plans.data?.filter((plan) => includeInactive || plan.active);
  // Los chips de tipo son los de las planificaciones que se ven. Uno de la URL que ya no existe es "Todos".
  const types = shown && typesOf(shown);
  const type = types?.find(({ key }) => key === typeParam)?.key ?? null;

  // La búsqueda mira el nombre y la descripción, como el `keyword` del backend (un plan viejo puede no tener nombre).
  const matches = (plan: PlanificationListItem) =>
    (type === null || typeKey(plan) === type) &&
    (matchesSearch(plan.name ?? '', search) ||
      matchesSearch(plan.description ?? '', search));
  const visible = shown
    ?.filter(matches)
    // Las vigentes primero (el backend ya las ordena por nombre).
    .sort((a, b) => Number(b.active) - Number(a.active));
  // Con el chip apagado quedan afuera las dadas de baja: si por eso no se ve nada, el vacío lo dice.
  const hiddenInactive =
    !includeInactive &&
    plans.data?.some((plan) => !plan.active && matches(plan));

  return (
    <>
      <SearchInput
        placeholder="Buscar planificación"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup wrap aria-label="Filtrar planificaciones">
        {types && types.length > 0 && (
          <>
            <Chip selected={type === null} onClick={() => setType(null)}>
              Todos
            </Chip>
            {types.map(({ key, label }) => (
              <Chip
                key={key}
                selected={type === key}
                onClick={() => setType(key)}
              >
                {label}
              </Chip>
            ))}
          </>
        )}
        <Chip
          tone="acc"
          selected={includeInactive}
          onClick={() => setIncludeInactive(!includeInactive)}
        >
          Incluir inactivas
        </Chip>
      </ChipGroup>
      {visible ? (
        visible.length === 0 ? (
          plans.data?.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Todavía no hay planificaciones"
              message="Creá la primera para armar el plan de tus alumnos."
              action={
                <Button sm onClick={() => navigate(`${basePath}/nuevo`)}>
                  Crear planificación
                </Button>
              }
            />
          ) : hiddenInactive && !search.trim() && type === null ? (
            <EmptyState
              icon="calendar"
              title="No hay planificaciones activas"
              message="Todas están dadas de baja. Activá “Incluir inactivas” para verlas."
            />
          ) : (
            <EmptyState
              icon="search"
              title="Sin coincidencias"
              message={
                hiddenInactive
                  ? 'No encontramos planificaciones activas con ese filtro. Activá “Incluir inactivas” para ver también las dadas de baja.'
                  : 'No encontramos planificaciones con ese filtro.'
              }
            />
          )
        ) : (
          <List columns={2}>
            {visible.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onOpen={({ id }) => navigate(`${basePath}/${id}`)}
                onAssign={onAssign}
              />
            ))}
          </List>
        )
      ) : plans.isError ? (
        <ErrorState
          message={getErrorMessage(plans.error)}
          onRetry={() => void plans.refetch()}
          retrying={plans.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={4} />
      )}
      <Fab
        label="Crear planificación"
        onClick={() => navigate(`${basePath}/nuevo`)}
      />
    </>
  );
}
