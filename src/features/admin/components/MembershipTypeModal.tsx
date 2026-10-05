import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { Membership } from '@/api/types';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Columns,
  Field,
  Input,
  Modal,
  Note,
  useToast,
} from '@/shared/ui';

import { useSaveMembershipType } from '../hooks/useSaveMembershipType';
import {
  membershipTypeSchema,
  type MembershipTypeInput,
  type MembershipTypeValues,
} from '../schemas';
import styles from './MembershipTypeModal.module.css';

/** Lo que responde `createMembership` (con un 400) si otro tipo ya tiene esa duración. */
const DUPLICATE_DURATION_MESSAGE = 'Ya existe una membresía con esa duración';

interface MembershipTypeModalProps {
  /** El tipo a editar, `'new'` para dar de alta uno, o `null` con el modal cerrado. */
  target: Membership | 'new' | null;
  onClose: () => void;
}

/** El alta y la edición de un tipo de membresía (CU-A-21 y CU-A-22), en un modal. */
export function MembershipTypeModal({
  target,
  onClose,
}: MembershipTypeModalProps) {
  const type = target === 'new' ? undefined : (target ?? undefined);
  const save = useSaveMembershipType(type);
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
      title={type ? 'Editar membresía' : 'Nueva membresía'}
      description={
        type &&
        'Los cambios valen para los pagos nuevos: los ya registrados no se modifican.'
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
        <MembershipTypeForm
          id={formId}
          type={type}
          save={save}
          onSaved={close}
        />
      )}
    </Modal>
  );
}

interface MembershipTypeFormProps {
  id: string;
  type?: Membership;
  save: ReturnType<typeof useSaveMembershipType>;
  onSaved: () => void;
}

function MembershipTypeForm({
  id,
  type,
  save,
  onSaved,
}: MembershipTypeFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MembershipTypeInput, unknown, MembershipTypeValues>({
    resolver: zodResolver(membershipTypeSchema),
    defaultValues: {
      name: type?.name ?? '',
      price: type ? String(type.price) : '',
      duration: type ? String(type.duration) : '30',
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (save.isPending) return;
    save.mutate(values, {
      onSuccess: () => {
        toast.success(type ? 'Membresía guardada' : 'Membresía creada');
        onSaved();
      },
    });
  });

  return (
    <form id={id} onSubmit={onSubmit} noValidate>
      {save.isError && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {isApiError(save.error) &&
          save.error.serverMessage === DUPLICATE_DURATION_MESSAGE
            ? 'Ya hay un tipo de membresía con esa duración. Elegí otra o editá ese tipo.'
            : getErrorMessage(save.error, {
                404: 'La membresía ya no existe. Cerrá esta ventana y volvé a intentar.',
              })}
        </Note>
      )}
      <Field label="Nombre" error={errors.name?.message}>
        <Input
          maxLength={50}
          autoComplete="off"
          placeholder="Ej: Plan Semestral"
          {...register('name')}
        />
      </Field>
      <Columns>
        <Field label="Precio ($)" error={errors.price?.message}>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            {...register('price')}
          />
        </Field>
        <Field label="Duración (días)" error={errors.duration?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            {...register('duration')}
          />
        </Field>
      </Columns>
    </form>
  );
}
