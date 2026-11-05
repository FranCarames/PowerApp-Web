import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { CircuitType } from '@/api/types';
import { compareTypeNames } from '@/features/catalog/circuitTypes';
import { useCircuitTypes } from '@/features/catalog/hooks/useCircuitTypes';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Fab,
  List,
  ListSkeleton,
  PageHeader,
  useToast,
} from '@/shared/ui';

import { CircuitTypeCard } from '../components/CircuitTypeCard';
import { CircuitTypeModal } from '../components/CircuitTypeModal';
import { useSetCircuitTypeActive } from '../hooks/useSetCircuitTypeActive';
import styles from './CircuitTypesPage.module.css';

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
 */
export function CircuitTypesPage() {
  const toast = useToast();
  const types = useCircuitTypes({ includeInactive: true });
  const setActive = useSetCircuitTypeActive();
  const [editing, setEditing] = useState<CircuitType | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<CircuitType | null>(null);

  const sorted = types.data && [...types.data].sort(byAvailabilityAndName);

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
      {sorted ? (
        sorted.length === 0 ? (
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
        ) : (
          <List columns={2}>
            {sorted.map((type) => (
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
