import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { CircuitType } from '@/api/types';
import { compareTypeNames } from '@/features/catalog/circuitTypes';
import { useCircuitTypes } from '@/features/catalog/hooks/useCircuitTypes';
import { matchesSearch } from '@/shared/lib/text';
import {
  KEYWORD_MAX_LENGTH,
  useSearchAndFilter,
} from '@/shared/lib/useSearchAndFilter';
import {
  Button,
  Chip,
  ChipGroup,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Fab,
  List,
  ListSkeleton,
  PageHeader,
  SearchInput,
  useToast,
} from '@/shared/ui';

import { CircuitTypeCard } from '../components/CircuitTypeCard';
import { CircuitTypeModal } from '../components/CircuitTypeModal';
import { useSetCircuitTypeActive } from '../hooks/useSetCircuitTypeActive';
import styles from './CircuitTypesPage.module.css';

/** El valor del chip "Incluir inactivos" en la URL, como en Circuitos. */
const INACTIVE_PARAM = 'inactivos';

/** Primero los activos, y cada grupo por orden alfabético. */
function byAvailabilityAndName(a: CircuitType, b: CircuitType) {
  return (
    Number(b.active) - Number(a.active) || compareTypeNames(a.type, b.type)
  );
}

/**
 * Tipos de circuito del Admin (CU-A-24 a CU-A-27), con el patrón de Tipos de membresía: las tarjetas
 * con el nombre, cuántos circuitos activos lo usan y la descripción; el alta y la edición en un modal;
 * y eliminar, que es una baja lógica que se puede revertir reactivando el tipo. El Entrenador no tiene
 * esta pantalla: elige los tipos al armar un circuito y filtra el listado con ellos.
 *
 * Con el buscador (por nombre, sin tildes ni mayúsculas; no mira la descripción) y el chip «Incluir
 * inactivos», apagado de entrada, como Rutinas (CU-A-24, pasos 4 y 5): los dados de baja se ven solo
 * con el chip, así que dar uno de baja con el chip apagado lo saca de la lista (regla 3). Los dos
 * quedan en la URL (`?q=…&filtro=inactivos`).
 */
export function CircuitTypesPage() {
  const toast = useToast();
  const { search, setSearch, filter, setFilter } = useSearchAndFilter(
    'filtro',
    [INACTIVE_PARAM],
  );
  const includeInactive = filter === INACTIVE_PARAM;
  // Una sola lista con los de baja incluidos: el chip filtra sin volver a pedirla.
  const types = useCircuitTypes({ includeInactive: true });
  const setActive = useSetCircuitTypeActive();
  const [editing, setEditing] = useState<CircuitType | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<CircuitType | null>(null);

  const matches = (type: CircuitType) => matchesSearch(type.type, search);
  const visible = types.data
    ?.filter((type) => (includeInactive || type.active) && matches(type))
    .sort(byAvailabilityAndName);
  // Con el chip apagado quedan afuera los dados de baja: si por eso no se ve nada, el vacío lo dice.
  const hiddenInactive =
    !includeInactive &&
    types.data?.some((type) => !type.active && matches(type));

  function change(type: CircuitType, active: boolean) {
    setActive.mutate(
      { id: type.id, active },
      {
        onSuccess: () => {
          toast.success(
            active
              ? 'Tipo de circuito reactivado'
              : 'Tipo de circuito dado de baja',
          );
          setToDelete(null);
        },
        onError: (error) => {
          toast.error(
            getErrorMessage(error, {
              404: 'El tipo de circuito ya no existe.',
            }),
          );
          setToDelete(null);
        },
      },
    );
  }

  return (
    <>
      <PageHeader eyebrow="Configuración" title="Tipos de circuito" />
      <p className={styles.intro}>
        Los entrenadores eligen uno al armar cada circuito y filtran el listado
        con ellos.
      </p>
      <SearchInput
        placeholder="Buscar tipo de circuito"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup aria-label="Filtrar tipos de circuito">
        <Chip
          selected={includeInactive}
          onClick={() => setFilter(includeInactive ? null : INACTIVE_PARAM)}
        >
          Incluir inactivos
        </Chip>
      </ChipGroup>
      {visible ? (
        visible.length === 0 ? (
          types.data?.length === 0 ? (
            <EmptyState
              icon="cycle"
              title="Todavía no hay tipos de circuito"
              message="Creá el primero: sin un tipo activo no se pueden crear circuitos."
              action={
                <Button sm onClick={() => setEditing('new')}>
                  Crear tipo de circuito
                </Button>
              }
            />
          ) : hiddenInactive && !search.trim() ? (
            <EmptyState
              icon="cycle"
              title="No hay tipos activos"
              message="Todos están dados de baja. Activá “Incluir inactivos” para verlos."
            />
          ) : (
            <EmptyState
              icon="search"
              title="Sin coincidencias"
              message={
                hiddenInactive
                  ? 'No encontramos tipos activos con esa búsqueda. Activá “Incluir inactivos” para ver también los dados de baja.'
                  : 'No hay tipos de circuito con esa búsqueda.'
              }
            />
          )
        ) : (
          <List columns={2}>
            {visible.map((type) => (
              <CircuitTypeCard
                key={type.id}
                type={type}
                onEdit={setEditing}
                onDelete={setToDelete}
                onReactivate={(target) => change(target, true)}
                reactivating={
                  setActive.isPending && setActive.variables?.id === type.id
                }
              />
            ))}
          </List>
        )
      ) : types.isError ? (
        <ErrorState
          message={getErrorMessage(types.error)}
          onRetry={() => void types.refetch()}
          retrying={types.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={3} />
      )}
      <Fab label="Crear tipo de circuito" onClick={() => setEditing('new')} />
      <CircuitTypeModal target={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={toDelete !== null}
        destructive
        title="Eliminar tipo de circuito"
        message={
          toDelete && (
            <>
              ¿Eliminar <b>{toDelete.type}</b>? Es una baja lógica: deja de
              ofrecerse para circuitos nuevos, y los circuitos que ya lo tienen
              lo conservan. Lo podés reactivar cuando quieras.
            </>
          )
        }
        confirmLabel="Eliminar"
        loading={setActive.isPending}
        onConfirm={() => toDelete && change(toDelete, false)}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
