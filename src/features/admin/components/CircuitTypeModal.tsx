import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { getErrorMessage } from '@/api/errors';
import type { CircuitType } from '@/api/types';
import { zodResolver } from '@/shared/lib/zodResolver';
import { Button, Field, Input, Modal, Note, useToast } from '@/shared/ui';

import { useSaveCircuitType } from '../hooks/useSaveCircuitType';
import {
  circuitTypeSchema,
  type CircuitTypeInput,
  type CircuitTypeValues,
} from '../schemas';
import styles from './CircuitTypeModal.module.css';

interface CircuitTypeModalProps {
  /** El tipo a editar, `'new'` para dar de alta uno, o `null` con el modal cerrado. */
  target: CircuitType | 'new' | null;
  onClose: () => void;
}

/** El alta y la edición de un tipo de circuito (CU-A-25 y CU-A-26), en un modal. */
export function CircuitTypeModal({ target, onClose }: CircuitTypeModalProps) {
  const type = target === 'new' ? undefined : (target ?? undefined);
  const save = useSaveCircuitType(type);
  const formId = useId();

  function close() {
    // Un error del intento anterior no tiene que verse al volver a abrir el modal.
    save.reset();
    onClose();
  }

  return (
    <Modal
      open={target !== null}
      onClose={close}
      blocking={save.isPending}
      title={type ? 'Editar tipo de circuito' : 'Nuevo tipo de circuito'}
      description={
        type && 'El cambio se ve en todos los circuitos que lo usan.'
      }
      actions={
        <>
          <Button type="submit" form={formId} loading={save.isPending}>
            Guardar
          </Button>
          <Button variant="ghost" disabled={save.isPending} onClick={close}>
            Cancelar
          </Button>
        </>
      }
    >
      {target && (
        <CircuitTypeForm id={formId} type={type} save={save} onSaved={close} />
      )}
    </Modal>
  );
}

interface CircuitTypeFormProps {
  id: string;
  type?: CircuitType;
  save: ReturnType<typeof useSaveCircuitType>;
  onSaved: () => void;
}

function CircuitTypeForm({ id, type, save, onSaved }: CircuitTypeFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CircuitTypeInput, unknown, CircuitTypeValues>({
    resolver: zodResolver(circuitTypeSchema),
    defaultValues: {
      type: type?.type ?? '',
      description: type?.description ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (save.isPending) return;
    save.mutate(values, {
      onSuccess: () => {
        toast.success(
          type ? 'Tipo de circuito guardado' : 'Tipo de circuito creado',
        );
        onSaved();
      },
    });
  });

  return (
    <form id={id} onSubmit={onSubmit} noValidate>
      {save.isError && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {getErrorMessage(save.error, {
            404: 'El tipo de circuito ya no existe. Cerrá esta ventana y volvé a intentar.',
            409: 'Ya hay un tipo de circuito con ese nombre. Elegí otro o editá ese tipo.',
          })}
        </Note>
      )}
      <Field label="Nombre" error={errors.type?.message}>
        <Input
          maxLength={50}
          autoComplete="off"
          placeholder="Ej: Movilidad"
          {...register('type')}
        />
      </Field>
      <Field
        label="Descripción"
        error={errors.description?.message}
        hint="Opcional."
      >
        <Input
          maxLength={100}
          autoComplete="off"
          placeholder="Ej: Activación antes del bloque principal"
          {...register('description')}
        />
      </Field>
    </form>
  );
}
