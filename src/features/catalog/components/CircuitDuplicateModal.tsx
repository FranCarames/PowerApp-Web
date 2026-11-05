import { useState } from 'react';

import type { CircuitType } from '@/api/types';
import { Button, Field, Modal, Note, Select } from '@/shared/ui';

import styles from './CircuitDuplicateModal.module.css';

interface CircuitDuplicateModalProps {
  open: boolean;
  /** El nombre del circuito que se duplica y el de su tipo, que está dado de baja. */
  circuitName: string;
  typeName: string;
  /** Si hay cambios sin guardar: la copia sale de la versión guardada y se descartan. */
  dirty: boolean;
  /** Los tipos activos por orden alfabético, si ya llegaron. */
  actives?: CircuitType[];
  /** Si el pedido de los tipos falló. */
  failed: boolean;
  /** Mientras se crea la copia. */
  loading: boolean;
  onConfirm: (circuitTypeId: string) => void;
  onCancel: () => void;
}

/**
 * Duplicar un circuito cuyo tipo está dado de baja (plan de la BE-44, 5.1.10): la copia es un circuito
 * nuevo y no puede llevarlo, así que se elige el tipo de la copia entre los activos. Sin ninguno activo,
 * lo dice y solo se puede cerrar. Si además hay cambios sin guardar, primero lo avisa, como el diálogo de
 * siempre.
 */
export function CircuitDuplicateModal({
  open,
  circuitName,
  typeName,
  dirty,
  actives,
  failed,
  loading,
  onConfirm,
  onCancel,
}: CircuitDuplicateModalProps) {
  const [typeId, setTypeId] = useState('');
  const none = actives?.length === 0;

  // El tipo elegido no queda para la próxima vez que se abra.
  function cancel() {
    setTypeId('');
    onCancel();
  }

  function confirm() {
    setTypeId('');
    onConfirm(typeId);
  }

  return (
    <Modal
      open={open}
      onClose={cancel}
      blocking={loading}
      // Como el diálogo de Duplicar con cambios sin guardar (un `ConfirmDialog`).
      icon="alert"
      tone="warn"
      title="Duplicar circuito"
      description={
        <>
          {/* Sin tipos activos no hay copia: los cambios sin guardar no vienen al caso. */}
          {dirty && !none && (
            <span className={styles.paragraph}>
              Hay cambios sin guardar. La copia se hace con la versión guardada
              de <b>{circuitName}</b>, sin ellos, y vas a pasar a editarla.
            </span>
          )}
          <span className={styles.paragraph}>
            {none ? (
              <>
                El tipo <b>{typeName}</b> está dado de baja y no hay otro tipo
                activo, así que por ahora no se puede duplicar.
              </>
            ) : (
              <>
                El tipo <b>{typeName}</b> está dado de baja y una copia no puede
                llevarlo. Elegí el tipo de la copia.
              </>
            )}
          </span>
        </>
      }
      actions={
        none ? (
          <Button variant="ghost" onClick={cancel}>
            Cerrar
          </Button>
        ) : (
          <>
            <Button
              loading={loading}
              disabled={typeId === ''}
              onClick={confirm}
            >
              Duplicar
            </Button>
            <Button variant="ghost" disabled={loading} onClick={cancel}>
              Cancelar
            </Button>
          </>
        )
      }
    >
      {!none &&
        (failed && !actives ? (
          <Note tone="err" icon="alert" role="alert">
            No pudimos cargar los tipos de circuito.
          </Note>
        ) : (
          <Field label="Tipo de la copia">
            <Select
              value={typeId}
              disabled={!actives || loading}
              onChange={(event) => setTypeId(event.target.value)}
            >
              <option value="">
                {actives ? 'Elegí un tipo' : 'Cargando tipos…'}
              </option>
              {actives?.map(({ id, type }) => (
                <option key={id} value={id}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>
        ))}
    </Modal>
  );
}
