import type { MuscleGroupWithMuscles } from '@/api/pending';
import { groupTone } from '@/features/catalog/groupTone';
import { Icon } from '@/shared/icons';
import { Card, IconButton } from '@/shared/ui';

import styles from './GroupRow.module.css';

interface GroupRowProps {
  group: MuscleGroupWithMuscles;
  onOpen: (group: MuscleGroupWithMuscles) => void;
  onEdit: (group: MuscleGroupWithMuscles) => void;
  onDelete: (group: MuscleGroupWithMuscles) => void;
}

/**
 * Un grupo muscular: su nombre y cuántos músculos tiene. Tocarlo abre sus músculos; a la derecha,
 * Editar y Eliminar. La fila no es un solo botón porque lleva otros botones adentro.
 */
export function GroupRow({ group, onOpen, onEdit, onDelete }: GroupRowProps) {
  const count = group.muscles.length;

  return (
    <Card row>
      <button
        type="button"
        className={styles.main}
        onClick={() => onOpen(group)}
      >
        <span
          aria-hidden="true"
          className={`${styles.tile} ${styles[groupTone(group.id)]}`}
        >
          <Icon name="list" size={18} />
        </span>
        <span className={styles.text}>
          <span className={styles.name}>{group.name}</span>
          <span className={styles.sub}>
            {count} músculo{count === 1 ? '' : 's'}
          </span>
        </span>
      </button>
      <IconButton
        variant="ghost"
        icon="edit"
        label={`Editar ${group.name}`}
        onClick={() => onEdit(group)}
      />
      <IconButton
        variant="ghost"
        danger
        icon="trash"
        label={`Eliminar ${group.name}`}
        onClick={() => onDelete(group)}
      />
    </Card>
  );
}
