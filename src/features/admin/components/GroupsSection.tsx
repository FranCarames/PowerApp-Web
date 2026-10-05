import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { MuscleGroupWithMuscles } from '@/api/pending';
import { useMuscleGroups } from '@/features/catalog/hooks/useMuscleGroups';
import { matchesSearch } from '@/shared/lib/text';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Fab,
  List,
  ListSkeleton,
  Modal,
  useToast,
} from '@/shared/ui';

import { useDeleteMuscleGroup } from '../hooks/useDeleteMuscleGroup';
import { GroupDetailModal } from './GroupDetailModal';
import { GroupFormModal } from './GroupFormModal';
import { GroupRow } from './GroupRow';

interface GroupsSectionProps {
  /** Lo que se escribió en el buscador del catálogo. */
  search: string;
}

/** Qué decir cuando no hay grupos, según lo que se estaba buscando. */
function EmptyGroups({
  catalogIsEmpty,
  onCreate,
}: {
  catalogIsEmpty: boolean;
  onCreate: () => void;
}) {
  if (catalogIsEmpty) {
    return (
      <EmptyState
        icon="list"
        title="Todavía no hay grupos musculares"
        message="Creá el primero para poder armar los músculos."
        action={
          <Button sm onClick={onCreate}>
            Crear grupo muscular
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon="search"
      title="Sin coincidencias"
      message="No hay grupos con ese nombre."
    />
  );
}

/**
 * El segmento Grupos musculares del Catálogo (CU-A-11 a CU-A-15): la lista filtrada por la búsqueda,
 * con la cantidad de músculos de cada grupo; el detalle con sus músculos; el alta y la edición en un
 * modal; y el borrado con confirmación.
 */
export function GroupsSection({ search }: GroupsSectionProps) {
  const toast = useToast();
  const groups = useMuscleGroups();
  const remove = useDeleteMuscleGroup();
  const [viewing, setViewing] = useState<MuscleGroupWithMuscles | null>(null);
  const [editing, setEditing] = useState<MuscleGroupWithMuscles | 'new' | null>(
    null,
  );
  const [toDelete, setToDelete] = useState<MuscleGroupWithMuscles | null>(null);

  const visible = groups.data
    ?.filter((group) => matchesSearch(group.name, search))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  function confirmDelete(group: MuscleGroupWithMuscles) {
    remove.mutate(group.id, {
      onSuccess: () => {
        toast.success('Grupo eliminado');
        setToDelete(null);
      },
      onError: (error) => {
        toast.error(
          getErrorMessage(error, {
            404: 'El grupo ya no existe.',
            // El backend responde 500 ante cualquier falla de integridad, sin decir el motivo (V7).
            500: 'No se pudo eliminar el grupo. Si todavía tiene músculos, movelos a otro grupo o eliminalos antes.',
          }),
        );
        setToDelete(null);
      },
    });
  }

  // Un grupo con músculos no se puede eliminar (CU-A-15): no se pide confirmación, se explica.
  const blocked = toDelete !== null && toDelete.muscles.length > 0;

  return (
    <>
      {visible ? (
        visible.length === 0 ? (
          <EmptyGroups
            catalogIsEmpty={groups.data?.length === 0}
            onCreate={() => setEditing('new')}
          />
        ) : (
          <List columns={2}>
            {visible.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                onOpen={setViewing}
                onEdit={setEditing}
                onDelete={setToDelete}
              />
            ))}
          </List>
        )
      ) : groups.isError ? (
        <ErrorState
          message={getErrorMessage(groups.error)}
          onRetry={() => void groups.refetch()}
          retrying={groups.isRefetching}
        />
      ) : (
        <ListSkeleton columns={2} rows={6} />
      )}
      <Fab label="Crear grupo muscular" onClick={() => setEditing('new')} />
      <GroupDetailModal group={viewing} onClose={() => setViewing(null)} />
      <GroupFormModal target={editing} onClose={() => setEditing(null)} />
      <Modal
        open={blocked}
        onClose={() => setToDelete(null)}
        icon="alert"
        tone="warn"
        title="No se puede eliminar"
        description={
          toDelete && (
            <>
              <b>{toDelete.name}</b> tiene {toDelete.muscles.length} músculo
              {toDelete.muscles.length === 1 ? '' : 's'}: el servidor no deja
              eliminar un grupo mientras tenga músculos. Movelos a otro grupo o
              eliminalos primero.
            </>
          )
        }
        actions={
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Entendido
          </Button>
        }
      />
      <ConfirmDialog
        open={toDelete !== null && !blocked}
        destructive
        title="Eliminar grupo muscular"
        message={
          toDelete && (
            <>
              ¿Eliminar <b>{toDelete.name}</b>? No se puede deshacer.
            </>
          )
        }
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onConfirm={() => toDelete && confirmDelete(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
