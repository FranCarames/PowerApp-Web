import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { CircuitListItemPlus } from '@/api/types';
import { capitalize, matchesSearch } from '@/shared/lib/text';
import {
  Button,
  EmptyState,
  ErrorState,
  List,
  ListItem,
  ListSkeleton,
  Modal,
  Pill,
  SearchInput,
  Tile,
} from '@/shared/ui';

import { useCircuits } from '../hooks/useCircuits';

interface CircuitPickerModalProps {
  open: boolean;
  /** Cuántas veces está cada circuito en la rutina: se avisa, pero se puede volver a elegir (un circuito se puede repetir). */
  usedCounts: ReadonlyMap<string, number>;
  onPick: (circuit: CircuitListItemPlus) => void;
  onClose: () => void;
}

/** Elegir un circuito activo para la rutina (CU-E-16 y CU-E-17): buscador por nombre o tipo y la lista de los vigentes. */
export function CircuitPickerModal({
  open,
  usedCounts,
  onPick,
  onClose,
}: CircuitPickerModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar circuito"
      actions={
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      }
    >
      {/* El contenido solo existe con el modal abierto: la búsqueda arranca vacía cada vez. */}
      {open && <PickerContent usedCounts={usedCounts} onPick={onPick} />}
    </Modal>
  );
}

function PickerContent({
  usedCounts,
  onPick,
}: Pick<CircuitPickerModalProps, 'usedCounts' | 'onPick'>) {
  // La misma lista de todos los circuitos que usan el listado y el editor de circuitos: se filtra acá.
  const circuits = useCircuits({ includeInactive: true });
  const [search, setSearch] = useState('');

  const available = circuits.data?.filter(({ active }) => active);
  const visible = available?.filter(
    ({ name, type }) =>
      matchesSearch(name, search) || matchesSearch(type, search),
  );

  return (
    <>
      <SearchInput
        placeholder="Buscar circuito"
        value={search}
        maxLength={100}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      {visible ? (
        visible.length === 0 ? (
          <EmptyState
            icon="search"
            message={
              available?.length === 0
                ? 'No hay circuitos activos. Creá uno con “Nuevo circuito”.'
                : 'No hay circuitos con esa búsqueda.'
            }
          />
        ) : (
          <List gap={8}>
            {visible.map((circuit) => {
              const used = usedCounts.get(circuit.id) ?? 0;
              return (
                <ListItem
                  key={circuit.id}
                  leading={<Tile icon="cycle" tone="acc" />}
                  title={circuit.name}
                  subtitle={`${capitalize(circuit.type)} · ${circuit.exercise_count} ejercicio${circuit.exercise_count === 1 ? '' : 's'}`}
                  trailing={
                    used > 0 && (
                      <Pill tone="acc">
                        {used === 1 ? 'En la rutina' : `En la rutina ×${used}`}
                      </Pill>
                    )
                  }
                  onClick={() => onPick(circuit)}
                />
              );
            })}
          </List>
        )
      ) : circuits.isError ? (
        <ErrorState
          message={getErrorMessage(circuits.error)}
          onRetry={() => void circuits.refetch()}
          retrying={circuits.isRefetching}
        />
      ) : (
        <ListSkeleton rows={4} />
      )}
    </>
  );
}
