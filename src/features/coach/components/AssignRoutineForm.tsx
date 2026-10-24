import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import type { User } from '@/api/types';
import { formatDate, toCalendarDay } from '@/shared/lib/dates';
import { fullName } from '@/shared/lib/fullName';
import { zodResolver } from '@/shared/lib/zodResolver';
import { Button, Field, Input, Note, useToast } from '@/shared/ui';

import { assignRoutineErrorMessage } from '../assignRoutineErrors';
import {
  assignRoutineSchema,
  type AssignRoutineValues,
} from '../assignRoutineSchema';
import { useAssignRoutine } from '../hooks/useAssignRoutine';
import styles from './AssignRoutineForm.module.css';

interface AssignRoutineFormProps {
  routine: { id: string; name: string };
  student: User;
  /** A dónde se vuelve al asignar: el editor de la rutina o el detalle del alumno, de donde se vino. */
  returnTo: string;
  /** El `state` de esa navegación (el editor de rutina recupera con él lo que había escrito). */
  returnState?: unknown;
}

/**
 * El día de una rutina puntual asignada a un alumno (CU-E-19), y el botón. Va con `key` por el alumno y la
 * rutina: al cambiar alguno, el formulario arranca de nuevo. El día arranca en hoy y puede ser pasado o
 * futuro. Es un día por asignación; para varios, se asigna de nuevo. Si el alumno ya tiene esa rutina ese
 * día, el backend responde 409 y se avisa sin crear nada: el aviso es de ese día, así que se va al cambiarlo.
 */
export function AssignRoutineForm({
  routine,
  student,
  returnTo,
  returnState,
}: AssignRoutineFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const assign = useAssignRoutine();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignRoutineValues>({
    resolver: zodResolver(assignRoutineSchema),
    defaultValues: { date: toCalendarDay() },
  });

  const onSubmit = handleSubmit(({ date }) => {
    if (assign.isPending) return;
    assign.mutate(
      { routine_id: routine.id, user_id: student.id, date },
      {
        onSuccess: () => {
          toast.success(
            `Rutina asignada · ${fullName(student)} · ${formatDate(date)}`,
          );
          navigate(returnTo, { state: returnState });
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field
        label="Día"
        error={errors.date?.message}
        hint="El día en que el alumno hace la rutina. Puede ser pasado o futuro."
      >
        <Input
          type="date"
          // El aviso del backend es de ese día: con otro, se descarta. Con el pedido en vuelo no: `reset`
          // soltaría su `onSuccess` y la asignación creada no avisaría ni volvería.
          {...register('date', {
            onChange: () => {
              if (!assign.isPending) assign.reset();
            },
          })}
        />
      </Field>
      {assign.isError && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {assignRoutineErrorMessage(assign.error)}
        </Note>
      )}
      <Button type="submit" loading={assign.isPending}>
        Asignar rutina
      </Button>
    </form>
  );
}
