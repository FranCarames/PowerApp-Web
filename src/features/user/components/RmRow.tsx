import type { UserRmWithExercise } from '@/api/pending';
import { formatDate } from '@/shared/lib/dates';
import { formatDecimal } from '@/shared/lib/format';
import { IconButton, ListItem, Tile } from '@/shared/ui';

import styles from './RmRow.module.css';

interface RmRowProps {
  rm: UserRmWithExercise;
  onEdit: (rm: UserRmWithExercise) => void;
  onDelete: (rm: UserRmWithExercise) => void;
}

/** Un RM registrado: las repeticiones y la fecha, el peso, y los botones de editar y eliminar. */
export function RmRow({ rm, onEdit, onDelete }: RmRowProps) {
  const name = rm.exercise.name;

  return (
    <ListItem
      leading={<Tile icon="trophy" tone="acc" />}
      title={`${rm.reps} ${rm.reps === 1 ? 'repetición' : 'repeticiones'}`}
      subtitle={formatDate(rm.date)}
      trailing={
        <>
          <span className={styles.weight}>
            {formatDecimal(rm.weight)}
            <span className={styles.unit}> kg</span>
          </span>
          <IconButton
            variant="ghost"
            icon="edit"
            label={`Editar RM de ${name}`}
            onClick={() => onEdit(rm)}
          />
          <IconButton
            variant="ghost"
            icon="trash"
            danger
            label={`Eliminar RM de ${name}`}
            onClick={() => onDelete(rm)}
          />
        </>
      }
    />
  );
}
