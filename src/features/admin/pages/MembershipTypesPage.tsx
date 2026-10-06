import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { Membership } from '@/api/types';
import { useMembershipTypes } from '@/features/account/hooks/useMembershipTypes';
import { useStudentCountByMembershipType } from '@/features/account/hooks/useStudentCountByMembershipType';
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

import { MembershipTypeCard } from '../components/MembershipTypeCard';
import { MembershipTypeModal } from '../components/MembershipTypeModal';
import { useSetMembershipTypeActive } from '../hooks/useSetMembershipTypeActive';

/** Primero los activos, y cada grupo de menor a mayor duración. */
function byAvailabilityAndDuration(a: Membership, b: Membership) {
  return Number(b.active) - Number(a.active) || a.duration - b.duration;
}

/**
 * Tipos de membresía del Admin (CU-A-20 a CU-A-23): las tarjetas con nombre, duración, alumnos y
 * precio; el alta y la edición en un modal; y eliminar, que es una baja lógica que se puede revertir
 * reactivando el tipo.
 */
export function MembershipTypesPage() {
  const toast = useToast();
  const types = useMembershipTypes();
  // Cuántos alumnos tiene cada tipo. Si no llega, las tarjetas no lo dicen.
  const studentCounts = useStudentCountByMembershipType();
  const setActive = useSetMembershipTypeActive();
  const [editing, setEditing] = useState<Membership | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Membership | null>(null);

  const sorted = types.data && [...types.data].sort(byAvailabilityAndDuration);

  function change(type: Membership, active: boolean) {
    setActive.mutate(
      { id: type.id, active },
      {
        onSuccess: () => {
          toast.success(
            active ? 'Membresía reactivada' : 'Membresía dada de baja',
          );
          setToDelete(null);
        },
        onError: (error) => {
          toast.error(
            getErrorMessage(error, { 404: 'La membresía ya no existe.' }),
          );
          setToDelete(null);
        },
      },
    );
  }

  return (
    <>
      <PageHeader eyebrow="Configuración" title="Tipos de membresía" />
      {sorted ? (
        sorted.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="Todavía no hay tipos de membresía"
            message="Creá el primero para poder registrar pagos."
            action={
              <Button sm onClick={() => setEditing('new')}>
                Crear membresía
              </Button>
            }
          />
        ) : (
          <List columns={2}>
            {sorted.map((type) => (
              <MembershipTypeCard
                key={type.id}
                type={type}
                // Un tipo sin alumnos no figura en la respuesta: son cero, si la respuesta llegó.
                students={
                  studentCounts.data
                    ? (studentCounts.data.get(type.id) ?? 0)
                    : undefined
                }
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
      <Fab label="Crear membresía" onClick={() => setEditing('new')} />
      <MembershipTypeModal target={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={toDelete !== null}
        destructive
        title="Eliminar membresía"
        message={
          toDelete && (
            <>
              ¿Eliminar <b>{toDelete.name}</b>? Es una baja lógica: deja de
              ofrecerse para pagos nuevos, pero los pagos ya registrados se
              conservan y la podés reactivar cuando quieras.
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
