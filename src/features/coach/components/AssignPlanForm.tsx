import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type {
  PlanificationListItem,
  User,
  UserPlanificationAssignment,
} from '@/api/types';
import { formatDate, toCalendarDay } from '@/shared/lib/dates';
import { fullName } from '@/shared/lib/fullName';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Columns,
  ConfirmDialog,
  Field,
  Input,
  Note,
  Textarea,
  useToast,
} from '@/shared/ui';

import { assignErrorMessage } from '../assignErrors';
import {
  ASSIGN_NOTE_MAX,
  assignPlanSchema,
  defaultEndDate,
  type AssignPlanInput,
  type AssignPlanValues,
} from '../assignSchema';
import { useAssignPlanification } from '../hooks/useAssignPlanification';
import { useSetUserPlanificationActive } from '../hooks/useSetUserPlanificationActive';
import { AssignOverlapNote } from './AssignOverlapNote';
import styles from './AssignPlanForm.module.css';

interface AssignPlanFormProps {
  plan: Pick<PlanificationListItem, 'id' | 'name' | 'duration'>;
  student: User;
  /** A dónde se vuelve al asignar: la lista de planes o el detalle del alumno, de donde se vino. */
  returnTo: string;
}

/**
 * Las asignaciones que se pisan, de lo que mandó el 409 (`overlapping`). Si el cuerpo no tiene esa forma,
 * no se sabe cuáles son: la lista queda vacía y el aviso lo dice sin detallarlas.
 */
function readOverlapping(body: unknown): UserPlanificationAssignment[] {
  if (typeof body !== 'object' || body === null) return [];
  const { overlapping } = body as { overlapping?: unknown };
  return Array.isArray(overlapping)
    ? (overlapping as UserPlanificationAssignment[])
    : [];
}

/**
 * Las fechas y la nota de una planificación asignada a un alumno (CU-E-13), y el botón. Va con `key` por
 * el alumno y la planificación: al cambiar alguno, el formulario arranca de nuevo. El inicio arranca en
 * hoy. Sin fin, lo calcula el backend (el domingo de la semana `duration`), y la pantalla lo anticipa; con
 * un plan de duración 0 el fin es obligatorio.
 *
 * Si el alumno ya tiene una planificación en esas fechas, el backend responde 409 con las que se pisan y
 * la pantalla las muestra, con tres salidas: ajustar las fechas, quitar la anterior (CU-E-14) o asignar
 * igual, que reenvía con `confirm_overlap: true`. El aviso es de esas fechas: si se cambian, desaparece.
 */
export function AssignPlanForm({
  plan,
  student,
  returnTo,
}: AssignPlanFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const assign = useAssignPlanification();
  const setActive = useSetUserPlanificationActive();
  const [overlap, setOverlap] = useState<{
    key: string;
    items: UserPlanificationAssignment[];
  } | null>(null);
  const [removing, setRemoving] = useState<UserPlanificationAssignment | null>(
    null,
  );

  const schema = useMemo(
    () => assignPlanSchema(plan.duration),
    [plan.duration],
  );
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssignPlanInput, unknown, AssignPlanValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      start_date: toCalendarDay(),
      end_date: '',
      coach_note: '',
    },
  });
  const [start, end] = useWatch({ control, name: ['start_date', 'end_date'] });

  // El aviso es de las fechas con las que se pidió (si se cambian, `clearOverlap` lo descarta). Sin
  // asignaciones que se pisen (quitadas todas) tampoco queda nada que avisar.
  const dates = `${start}|${end}`;
  const overlapping =
    overlap?.key === dates && overlap.items.length > 0 ? overlap.items : null;
  const failed =
    assign.isError &&
    !(isApiError(assign.error) && assign.error.status === 409);
  const hasFixedDuration = plan.duration > 0;
  const calculatedEnd =
    end === '' ? defaultEndDate(start, plan.duration) : null;

  const onSubmit = handleSubmit((values) => {
    if (assign.isPending) return;
    assign.mutate(
      {
        planification_id: plan.id,
        user_id: student.id,
        ...values,
        // Solo se confirma lo que ya se vio: el aviso de estas fechas está en pantalla.
        confirm_overlap: overlapping !== null,
      },
      {
        onSuccess: () => {
          toast.success(`Planificación asignada · ${fullName(student)}`);
          navigate(returnTo);
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 409) {
            setOverlap({ key: dates, items: readOverlapping(error.body) });
          }
        },
      },
    );
  });

  /** Con otras fechas el aviso ya no vale: se vuelve a pedir y el backend dice cuáles se pisan. */
  function clearOverlap() {
    setOverlap(null);
  }

  function removeOverlapping(target: UserPlanificationAssignment) {
    setActive.mutate(
      { id: target.id, active: false },
      {
        onSuccess: () => {
          toast.success('Planificación quitada');
          setOverlap(
            (current) =>
              current && {
                ...current,
                items: current.items.filter(({ id }) => id !== target.id),
              },
          );
          setRemoving(null);
        },
        onError: (error) => {
          toast.error(
            getErrorMessage(error, {
              400: 'Esa planificación ya estaba quitada.',
              404: 'Esa planificación ya no existe.',
            }),
          );
          setRemoving(null);
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {overlapping && (
        <AssignOverlapNote overlapping={overlapping} onRemove={setRemoving} />
      )}
      <Columns>
        <Field label="Fecha de inicio" error={errors.start_date?.message}>
          <Input
            type="date"
            {...register('start_date', { onChange: clearOverlap })}
          />
        </Field>
        <Field
          label={hasFixedDuration ? 'Fecha de fin (opcional)' : 'Fecha de fin'}
          error={errors.end_date?.message}
        >
          <Input
            type="date"
            {...register('end_date', { onChange: clearOverlap })}
          />
        </Field>
      </Columns>
      <p className={styles.hint}>
        {hasFixedDuration
          ? calculatedEnd
            ? `Sin fecha de fin, termina el domingo ${formatDate(calculatedEnd)}, al cerrar la semana ${plan.duration} del plan. `
            : ''
          : 'Este plan no tiene duración fija: indicá hasta cuándo dura. '}
        La semana 1 es la de lunes a domingo que contiene el inicio.
      </p>
      <Field
        label="Nota del coach"
        error={errors.coach_note?.message}
        hint="Opcional. La ve el alumno."
      >
        <Textarea
          maxLength={ASSIGN_NOTE_MAX}
          placeholder="Indicaciones para el alumno"
          {...register('coach_note')}
        />
      </Field>
      {failed && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {assignErrorMessage(assign.error)}
        </Note>
      )}
      <Button type="submit" loading={assign.isPending}>
        {overlapping ? 'Asignar igual' : 'Asignar planificación'}
      </Button>
      <ConfirmDialog
        open={removing !== null}
        destructive
        title="Quitar planificación"
        message={
          <>
            <b>{removing?.planification.name || 'La planificación'}</b> deja de
            verse en el home de <b>{fullName(student)}</b>, que ya no puede
            marcar ni anotar en ella. Es una baja lógica: lo que entrenó se
            conserva y la podés reincorporar desde su detalle.
          </>
        }
        confirmLabel="Quitar"
        loading={setActive.isPending}
        onConfirm={() => removing && removeOverlapping(removing)}
        onCancel={() => setRemoving(null)}
      />
    </form>
  );
}
