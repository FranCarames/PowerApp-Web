import type { MuscleWithGroup } from '@/api/pending';
import { groupTone } from '@/features/catalog/groupTone';
import { IconButton, ListItem, Tile } from '@/shared/ui';

interface MuscleRowProps {
  muscle: MuscleWithGroup;
  onEdit: (muscle: MuscleWithGroup) => void;
  onDelete: (muscle: MuscleWithGroup) => void;
}

/** Un músculo del catálogo: su nombre, su grupo (con el color del grupo), y las acciones de editar y eliminar. */
export function MuscleRow({ muscle, onEdit, onDelete }: MuscleRowProps) {
  return (
    <ListItem
      leading={<Tile icon="grid" tone={groupTone(muscle.muscle_group.id)} />}
      title={muscle.name}
      subtitle={muscle.muscle_group.name}
      trailing={
        <>
          <IconButton
            variant="ghost"
            icon="edit"
            label={`Editar ${muscle.name}`}
            onClick={() => onEdit(muscle)}
          />
          <IconButton
            variant="ghost"
            danger
            icon="trash"
            label={`Eliminar ${muscle.name}`}
            onClick={() => onDelete(muscle)}
          />
        </>
      }
    />
  );
}
