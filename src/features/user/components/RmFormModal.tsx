import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { getErrorMessage } from '@/api/errors';
import type { UserRmWithExercise } from '@/api/pending';
import { toCalendarDay } from '@/shared/lib/dates';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Columns,
  Field,
  Input,
  Modal,
  Note,
  Select,
  useToast,
} from '@/shared/ui';

import { useSaveRm } from '../hooks/useSaveRm';
import { rmSchema, type RmInput, type RmValues } from '../schemas';
import styles from './RmFormModal.module.css';

interface RmFormModalProps {
  /** El RM a editar, `'new'` para registrar uno, o `null` con el modal cerrado. */
  target: UserRmWithExercise | 'new' | null;
  userId: string;
  /** Los ejercicios para elegir, ordenados. `undefined` mientras no se cargaron. */
  exercises: readonly { id: string; name: string }[] | undefined;
  onClose: () => void;
}

/** El alta y la edición de un RM propio (CU-U-17 y CU-U-18), en un modal. */
export function RmFormModal({
  target,
  userId,
  exercises,
  onClose,
}: RmFormModalProps) {
  const rm = target === 'new' ? undefined : (target ?? undefined);
  const save = useSaveRm(userId, rm);
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
      title={rm ? 'Editar RM' : 'Registrar RM'}
      description="Registrá el peso y las repeticiones de tu récord."
      actions={
        <>
          <Button
            type="submit"
            form={formId}
            loading={save.isPending}
            disabled={!exercises?.length}
          >
            Guardar RM
          </Button>
          <Button variant="ghost" disabled={save.isPending} onClick={close}>
            Cancelar
          </Button>
        </>
      }
    >
      {target && (
        <RmForm
          id={formId}
          rm={rm}
          exercises={exercises}
          save={save}
          onSaved={close}
        />
      )}
    </Modal>
  );
}

interface RmFormProps {
  id: string;
  rm?: UserRmWithExercise;
  exercises: RmFormModalProps['exercises'];
  save: ReturnType<typeof useSaveRm>;
  onSaved: () => void;
}

function RmForm({ id, rm, exercises, save, onSaved }: RmFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RmInput, unknown, RmValues>({
    resolver: zodResolver(rmSchema),
    defaultValues: {
      exercise_id: rm?.exercise.id ?? '',
      weight: rm ? String(rm.weight) : '',
      reps: rm ? String(rm.reps) : '',
      // El backend guarda un día sin hora; por si algún día manda la hora, el campo usa solo el día.
      date: rm ? rm.date.slice(0, 10) : toCalendarDay(),
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (save.isPending) return;
    save.mutate(values, {
      onSuccess: () => {
        toast.success(rm ? 'RM actualizado' : 'RM registrado');
        onSaved();
      },
    });
  });

  return (
    <form id={id} onSubmit={onSubmit} noValidate>
      {save.isError && (
        <Note tone="err" icon="alert" role="alert" className={styles.notice}>
          {getErrorMessage(save.error, {
            404: rm
              ? 'Ese RM ya no existe. Cerrá esta ventana: la lista se actualiza.'
              : 'Ese ejercicio ya no existe. Elegí otro.',
          })}
        </Note>
      )}
      {exercises === undefined && (
        <Note tone="warn" icon="alert" className={styles.notice}>
          Todavía no se cargaron los ejercicios. Esperá un momento o cerrá esta
          ventana y volvé a intentar.
        </Note>
      )}
      {exercises?.length === 0 && (
        <Note tone="warn" icon="alert" className={styles.notice}>
          Todavía no hay ejercicios en la biblioteca.
        </Note>
      )}
      <Field
        label="Ejercicio"
        error={errors.exercise_id?.message}
        hint={rm && 'El ejercicio de un RM no se cambia: registrá uno nuevo.'}
      >
        {/* Editar no cambia el ejercicio (CU-U-18: peso, repeticiones o fecha). */}
        <Select {...register('exercise_id')} disabled={Boolean(rm)}>
          <option value="">Elegí un ejercicio</option>
          {exercises?.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </Select>
      </Field>
      <Columns>
        <Field label="Peso (kg)" error={errors.weight?.message}>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            placeholder="Ej: 80"
            {...register('weight')}
          />
        </Field>
        <Field label="Repeticiones" error={errors.reps?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            placeholder="Ej: 5"
            {...register('reps')}
          />
        </Field>
      </Columns>
      <Field label="Fecha" error={errors.date?.message}>
        <Input type="date" max={toCalendarDay()} {...register('date')} />
      </Field>
    </form>
  );
}
