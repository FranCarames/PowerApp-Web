import { useState, type ReactNode } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { CircuitListItemPlus } from '@/api/types';
import { matchesSearch } from '@/shared/lib/text';
import { KEYWORD_MAX_LENGTH } from '@/shared/lib/useSearchAndFilter';
import {
  Chip,
  ChipGroup,
  EmptyState,
  ErrorState,
  ListSkeleton,
  SearchInput,
} from '@/shared/ui';

import { circuitTypesOf } from '../circuitTypes';
import { useCircuits } from '../hooks/useCircuits';

interface CircuitLibraryProps {
  /** Cómo se ven los circuitos que pasan el filtro, en el orden del listado. */
  children: (visible: CircuitListItemPlus[]) => ReactNode;
  /** Las filas grises mientras carga. */
  skeletonRows?: number;
}

/**
 * Los circuitos que se pueden sumar a una rutina (CU-E-16 y CU-E-17, paso 2), lo común de «Agregar
 * circuitos» y de la biblioteca del editor en escritorio: solo los activos, el buscador por nombre (sin
 * tildes ni mayúsculas, como el listado de Circuitos: no mira el tipo) y, debajo, «Todos» y un chip por
 * cada tipo de esos circuitos, por orden alfabético. Se combinan. Ninguno va a la URL: arrancan vacíos
 * cada vez que se monta. Con la carga, el error y los vacíos; cada pantalla dibuja los circuitos.
 */
export function CircuitLibrary({
  children,
  skeletonRows = 4,
}: CircuitLibraryProps) {
  // La misma lista que usan el listado y el editor de rutina: se filtra acá, sin volver a pedirla.
  const circuits = useCircuits({ includeInactive: true });
  const [search, setSearch] = useState('');
  const [typeId, setTypeId] = useState<string | null>(null);

  if (!circuits.data) {
    return circuits.isError ? (
      <ErrorState
        message={getErrorMessage(circuits.error)}
        onRetry={() => void circuits.refetch()}
        retrying={circuits.isRefetching}
      />
    ) : (
      <ListSkeleton rows={skeletonRows} />
    );
  }

  const available = circuits.data.filter(({ active }) => active);
  if (available.length === 0) {
    return (
      <EmptyState
        icon="cycle"
        message="No hay circuitos activos. Creá uno con “Nuevo circuito”."
      />
    );
  }

  const types = circuitTypesOf(available);
  // Un tipo elegido que ya no está entre los chips (la lista se refrescó) cuenta como «Todos».
  const type = types.find(({ id }) => id === typeId)?.id ?? null;
  const visible = available.filter(
    (circuit) =>
      (type === null || circuit.circuit_type.id === type) &&
      matchesSearch(circuit.name, search),
  );

  return (
    <>
      <SearchInput
        placeholder="Buscar circuito"
        value={search}
        maxLength={KEYWORD_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <ChipGroup wrap aria-label="Filtrar por tipo">
        <Chip selected={type === null} onClick={() => setTypeId(null)}>
          Todos
        </Chip>
        {types.map(({ id, type: name }) => (
          <Chip key={id} selected={type === id} onClick={() => setTypeId(id)}>
            {name}
          </Chip>
        ))}
      </ChipGroup>
      {visible.length === 0 ? (
        <EmptyState
          icon="search"
          title="Sin coincidencias"
          message="No hay circuitos con ese filtro."
        />
      ) : (
        children(visible)
      )}
    </>
  );
}
