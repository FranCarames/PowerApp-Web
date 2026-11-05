import type { CircuitType } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { Card, IconButton, Pill, Tile } from '@/shared/ui';

import styles from './CircuitTypeCard.module.css';

interface CircuitTypeCardProps {
  type: CircuitType;
  onEdit: (type: CircuitType) => void;
  onDelete: (type: CircuitType) => void;
  onReactivate: (type: CircuitType) => void;
  /** Mientras se reactiva este tipo, su botón queda ocupado. */
  reactivating?: boolean;
}

/**
 * Un tipo de circuito (CU-A-24): el nombre, cuántos circuitos activos lo usan y la descripción, si
 * tiene. Si está dado de baja, se ve apagado con "Inactivo", y en lugar de eliminarlo se lo puede
 * reactivar. La tarjeta es contenido: el foco va a sus botones.
 */
export function CircuitTypeCard({
  type,
  onEdit,
  onDelete,
  onReactivate,
  reactivating = false,
}: CircuitTypeCardProps) {
  const count = type.circuit_count;

  return (
    <Card className={cx(!type.active && styles.inactive)}>
      <div className={styles.head}>
        <Tile icon="cycle" tone="acc" />
        <div className={styles.text}>
          <div className={styles.name}>{type.type}</div>
          <div className={styles.sub}>
            {count} circuito{count === 1 ? '' : 's'}
          </div>
        </div>
        <IconButton
          variant="ghost"
          icon="edit"
          label={`Editar ${type.type}`}
          onClick={() => onEdit(type)}
        />
        {type.active ? (
          <IconButton
            variant="ghost"
            danger
            icon="trash"
            label={`Eliminar ${type.type}`}
            onClick={() => onDelete(type)}
          />
        ) : (
          <IconButton
            variant="ghost"
            icon="refresh"
            label={`Reactivar ${type.type}`}
            disabled={reactivating}
            onClick={() => onReactivate(type)}
          />
        )}
      </div>
      {(type.description || !type.active) && (
        <div className={styles.foot}>
          <span className={styles.description}>{type.description}</span>
          {!type.active && <Pill tone="warn">Inactivo</Pill>}
        </div>
      )}
    </Card>
  );
}
