import { useId, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import type { RoutineAssignedFinished } from '@/api/types';
import { toCalendarDay } from '@/shared/lib/dates';
import { zodResolver } from '@/shared/lib/zodResolver';
import { Button, Field, Input, Modal, Textarea } from '@/shared/ui';

import {
  USER_NOTE_MAX_LENGTH,
  exerciseLogSchema,
  type ExerciseLogInput,
  type ExerciseLogValues,
} from '../schemas';

interface ExerciseLogModalProps {
  open: boolean;
  /** Lo que el alumno ya registró del ejercicio, si lo marcó. Sin esto, el modal marca el ejercicio. */
  finished: RoutineAssignedFinished | undefined;
  onSubmit: (values: ExerciseLogValues) => void;
  onClose: () => void;
}

/**
 * El día y la nota de un ejercicio (CU-U-12 y CU-U-13), en un modal. Si el ejercicio todavía no estaba
 * marcado, guardar lo marca con el día elegido (la app propone hoy), que es como se marca en diferido;
 * si ya lo estaba, corrige el día y la nota. Una nota vacía borra la que había.
 */
export function ExerciseLogModal({
  open,
  finished,
  onSubmit,
  onClose,
}: ExerciseLogModalProps) {
  const formId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={finished ? 'Tu registro' : 'Marcar como hecho'}
      description={
        finished
          ? 'Corregí el día en que lo hiciste o editá tu nota.'
          : 'Indicá el día en que lo hiciste y, si querés, dejá una nota. Al guardar, el ejercicio queda hecho.'
      }
      actions={
        <>
          <Button type="submit" form={formId}>
            {finished ? 'Guardar' : 'Guardar y marcar'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      {open && (
        <ExerciseLogForm id={formId} finished={finished} onSubmit={onSubmit} />
      )}
    </Modal>
  );
}

function ExerciseLogForm({
  id,
  finished,
  onSubmit,
}: {
  id: string;
  finished: RoutineAssignedFinished | undefined;
  onSubmit: (values: ExerciseLogValues) => void;
}) {
  const today = toCalendarDay();
  // Una marca hecha desde otro lado puede traer un día posterior a hoy: no se la bloquea.
  const latestDay =
    finished && finished.finished_at > today ? finished.finished_at : today;
  const schema = useMemo(() => exerciseLogSchema(latestDay), [latestDay]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExerciseLogInput, unknown, ExerciseLogValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      finished_at: finished?.finished_at ?? today,
      user_note: finished?.user_note ?? '',
    },
  });

  const length = useWatch({ control, name: 'user_note' }).length;

  return (
    <form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Día en que lo hiciste" error={errors.finished_at?.message}>
        <Input type="date" max={latestDay} {...register('finished_at')} />
      </Field>
      <Field
        label="Tu nota"
        error={errors.user_note?.message}
        hint={`${length}/${USER_NOTE_MAX_LENGTH} caracteres`}
      >
        <Textarea
          rows={3}
          maxLength={USER_NOTE_MAX_LENGTH}
          placeholder="Ej: Me costó la última serie"
          {...register('user_note')}
        />
      </Field>
    </form>
  );
}
