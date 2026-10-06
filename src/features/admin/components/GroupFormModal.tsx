import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { getErrorMessage } from '@/api/errors';
import type { MuscleGroupWithMuscles } from '@/api/pending';
import { zodResolver } from '@/shared/lib/zodResolver';
import { Button, Field, Input, Modal, Note, useToast } from '@/shared/ui';

import { useSaveMuscleGroup } from '../hooks/useSaveMuscleGroup';
import { muscleGroupSchema, type MuscleGroupValues } from '../schemas';
import styles from './GroupFormModal.module.css';

interface GroupFormModalProps {
  /** El grupo a editar, `'new'` para dar de alta uno, o `null` con el modal cerrado. */
  target: MuscleGroupWithMuscles | 'new' | null;
  onClose: () => void;
}

/** El alta y la edición de un grupo muscular (CU-A-13 y CU-A-14), en un modal. */
export function GroupFormModal({ target, onClose }: GroupFormModalProps) {
  const group = target === 'new' ? undefined : (target ?? undefined);
  const save = useSaveMuscleGroup(group);
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
      title={group ? 'Editar grupo muscular' : 'Nuevo grupo muscular'}
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
        <GroupForm id={formId} group={group} save={save} onSaved={close} />
      )}
    </Modal>
  );
}

interface GroupFormProps {
  id: string;
  group?: MuscleGroupWithMuscles;
  save: ReturnType<typeof useSaveMuscleGroup>;
  onSaved: () => void;
}

function GroupForm({ id, group, save, onSaved }: GroupFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MuscleGroupValues>({
    resolver: zodResolver(muscleGroupSchema),
    defaultValues: {
      name: group?.name ?? '',
      image_url: group?.image_url ?? '',
      preview_image: group?.preview_image ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (save.isPending) return;
    save.mutate(values, {
      onSuccess: () => {
        toast.success(group ? 'Grupo guardado' : 'Grupo creado');
        onSaved();
      },
    });
  });

  return (
    <form id={id} onSubmit={onSubmit} noValidate>
      {save.isError && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {getErrorMessage(save.error, {
            404: 'El grupo muscular ya no existe. Cerrá esta ventana y volvé a intentar.',
          })}
        </Note>
      )}
      <Field label="Nombre" error={errors.name?.message}>
        <Input
          maxLength={50}
          autoComplete="off"
          placeholder="Ej: Antebrazos"
          {...register('name')}
        />
      </Field>
      <Field
        label="Imagen (link)"
        error={errors.image_url?.message}
        hint="Opcional."
      >
        <Input
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://…"
          {...register('image_url')}
        />
      </Field>
      <Field
        label="Imagen de vista previa (link)"
        error={errors.preview_image?.message}
        hint="Opcional."
      >
        <Input
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://…"
          {...register('preview_image')}
        />
      </Field>
    </form>
  );
}
