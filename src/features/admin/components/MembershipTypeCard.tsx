import type { Membership } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { formatPrice } from '@/shared/lib/format';
import { Card, IconButton, Pill, Tile } from '@/shared/ui';

import styles from './MembershipTypeCard.module.css';

interface MembershipTypeCardProps {
  type: Membership;
  /** Cuántos alumnos tiene el tipo, si ya se sabe. Sin el dato, la tarjeta no lo dice. */
  students?: number;
  onEdit: (type: Membership) => void;
  onDelete: (type: Membership) => void;
  onReactivate: (type: Membership) => void;
  /** Mientras se reactiva este tipo, su botón queda ocupado. */
  reactivating?: boolean;
}

/**
 * Un tipo de membresía: nombre, duración, cuántos alumnos lo tienen y su precio. Si está dado de baja,
 * se ve apagado con "Inactiva", y en lugar de eliminarlo se puede reactivar.
 */
export function MembershipTypeCard({
  type,
  students,
  onEdit,
  onDelete,
  onReactivate,
  reactivating = false,
}: MembershipTypeCardProps) {
  return (
    <Card className={cx(!type.active && styles.inactive)}>
      <div className={styles.head}>
        <Tile icon="wallet" tone="ok" />
        <div className={styles.text}>
          <div className={styles.name}>{type.name}</div>
          <div className={styles.sub}>
            {type.duration} días
            {students !== undefined &&
              ` · ${students} alumno${students === 1 ? '' : 's'}`}
          </div>
        </div>
        <IconButton
          variant="ghost"
          icon="edit"
          label={`Editar ${type.name}`}
          onClick={() => onEdit(type)}
        />
        {type.active ? (
          <IconButton
            variant="ghost"
            danger
            icon="trash"
            label={`Eliminar ${type.name}`}
            onClick={() => onDelete(type)}
          />
        ) : (
          <IconButton
            variant="ghost"
            icon="refresh"
            label={`Reactivar ${type.name}`}
            disabled={reactivating}
            onClick={() => onReactivate(type)}
          />
        )}
      </div>
      <div className={styles.foot}>
        <span className={styles.price}>{formatPrice(type.price)}</span>
        {!type.active && <Pill tone="warn">Inactiva</Pill>}
      </div>
    </Card>
  );
}
