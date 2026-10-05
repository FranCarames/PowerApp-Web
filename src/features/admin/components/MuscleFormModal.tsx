import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { getErrorMessage } from '@/api/errors';
import type { MuscleGroupWithMuscles, MuscleWithGroup } from '@/api/pending';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Field,
  Input,
  Modal,
  Note,
  Select,
  Textarea,
  useToast,
} from '@/shared/ui';

import { useSaveMuscle } from '../hooks/useSaveMuscle';
import { muscleSchema, type MuscleValues } from '../schemas';
import styles from './MuscleFormModal.module.css';

interface MuscleFormModalProps {
  /** El músculo a editar, `'new'` para dar de alta uno, o `null` con el modal cerrado. */
  target: MuscleWithGroup | 'new' | null;
  /** Los grupos musculares, ordenados. `undefined` mientras no se cargaron. */
  groups: readonly MuscleGroupWithMuscles[] | undefined;
  onClose: () => void;
}

/** El alta y la edición de un músculo (CU-A-08 y CU-A-09), en un modal. */
export function MuscleFormModal({
  target,
  groups,
  onClose,
}: MuscleFormModalProps) {
  const muscle = target === 'new' ? undefined : (target ?? undefined);
  const save = useSaveMuscle(muscle);
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
      title={muscle ? 'Editar músculo' : 'Nuevo músculo'}
      actions={
        <>
          <Button
            type="submit"
            form={formId}
            loading={save.isPending}
            disabled={!groups?.length}
          >
            Guardar
          </Button>
          <Button variant="ghost" disabled={save.isPending} onClick={close}>
            Cancelar
          </Button>
        </>
      }
    >
      {target && (
        <MuscleForm
          id={formId}
          muscle={muscle}
          groups={groups}
          save={save}
          onSaved={close}
        />
      )}
    </Modal>
  );
}

interface MuscleFormProps {
  id: string;
  muscle?: MuscleWithGroup;
  groups: readonly MuscleGroupWithMuscles[] | undefined;
  save: ReturnType<typeof useSaveMuscle>;
  onSaved: () => void;
}

function MuscleForm({ id, muscle, groups, save, onSaved }: MuscleFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MuscleValues>({
    resolver: zodResolver(muscleSchema),
    defaultValues: {
      muscle_group_id: muscle?.muscle_group.id ?? groups?.[0]?.id ?? '',
      name: muscle?.name ?? '',
      description: muscle?.description ?? '',
      image_url: muscle?.image_url ?? '',
      preview_image: muscle?.preview_image ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (save.isPending) return;
    save.mutate(values, {
      onSuccess: () => {
        toast.success(muscle ? 'Músculo guardado' : 'Músculo creado');
        onSaved();
      },
    });
  });

  return (
    <form id={id} onSubmit={onSubmit} noValidate>
      {save.isError && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {getErrorMessage(save.error, {
            404: 'No encontramos el músculo o su grupo muscular. Cerrá esta ventana y volvé a intentar.',
          })}
        </Note>
      )}
      {groups?.length === 0 && (
        <Note tone="warn" icon="alert" className={styles.error}>
          Todavía no hay grupos musculares. Creá uno primero en Grupos
          musculares.
        </Note>
      )}
      {groups === undefined && (
        <Note tone="warn" icon="alert" className={styles.error}>
          Todavía no se cargaron los grupos musculares. Esperá un momento o
          cerrá esta ventana y volvé a intentar.
        </Note>
      )}
      <Field label="Nombre" error={errors.name?.message}>
        <Input
          maxLength={50}
          autoComplete="off"
          placeholder="Ej: Dorsal ancho"
          {...register('name')}
        />
      </Field>
      <Field label="Grupo muscular" error={errors.muscle_group_id?.message}>
        <Select {...register('muscle_group_id')}>
          {groups?.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Descripción"
        error={errors.description?.message}
        hint="Opcional."
      >
        <Textarea
          placeholder="Qué es y dónde está"
          {...register('description')}
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
