import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type {
  PlanificationListItem,
  User,
  UserPlanificationAssignment,
} from '@/api/types';
import { capped, parseCount } from '@/features/catalog/planRoutines';
import { PLAN_WEEKS_MAX } from '@/features/catalog/planSchema';
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
  NumberStepper,
  Textarea,
  useToast,
} from '@/shared/ui';

import { assignErrorMessage } from '../assignErrors';
import { planWeeksHint } from '../assignRange';
import {
  ASSIGN_NOTE_MAX,
  assignEndDate,
  assignPlanSchema,
  type AssignPlanInput,
  type AssignPlanValues,
} from '../assignSchema';
import { useAssignPlanification } from '../hooks/useAssignPlanification';
import { useSetUserPlanificationActive } from '../hooks/useSetUserPlanificationActive';
import { AssignOverlapNote } from './AssignOverlapNote';
import styles from './AssignPlanForm.module.css';
import { AssignRangeSummary } from './AssignRangeSummary';

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
 * El inicio, las semanas y la nota de una planificación asignada a un alumno (CU-E-13), y el botón. Va con
 * `key` por el alumno y la planificación: al cambiar alguno, el formulario arranca de nuevo, con el inicio en
 * hoy y «Semanas» en la duración del plan (vacío si el plan no tiene duración fija). El fin es el domingo de
 * la última semana, contando como semana 1 la de lunes a domingo que contiene el inicio: el resumen lo
 * muestra antes de asignar y el body lo lleva siempre. Los errores salen al salir del campo o al asignar.
 *
 * Si el alumno ya tiene una planificación en esas fechas, el backend responde 409 con las que se pisan y
 * la pantalla las muestra al pie, justo encima del botón, con tres salidas: ajustar el inicio o las semanas,
 * quitar la anterior (CU-E-14) o asignar igual, que reenvía con `confirm_overlap: true`. El aviso es de esas
 * fechas: si se cambia el inicio o las semanas, desaparece.
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
  // Cada 409 suma uno: el aviso aparece encima del botón y lo empuja hacia abajo, así que hay que llevar a
  // la vista el pie del formulario (el aviso, las tarjetas y el botón), con el foco en el botón.
  const [revealed, setRevealed] = useState(0);
  const tailRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getFieldState,
    formState: { errors, isSubmitted },
  } = useForm<AssignPlanInput, unknown, AssignPlanValues>({
    resolver: zodResolver(assignPlanSchema),
    mode: 'onTouched',
    defaultValues: {
      start_date: toCalendarDay(),
      weeks: plan.duration > 0 ? String(plan.duration) : '',
      coach_note: '',
    },
  });
  const [start, weeks] = useWatch({ control, name: ['start_date', 'weeks'] });

  // El aviso es de las fechas con las que se pidió (si se cambian, `clearOverlap` lo descarta). Sin
  // asignaciones que se pisen (quitadas todas) tampoco queda nada que avisar.
  const dates = `${start}|${weeks}`;
  const overlapping =
    overlap?.key === dates && overlap.items.length > 0 ? overlap.items : null;
  const failed =
    assign.isError &&
    !(isApiError(assign.error) && assign.error.status === 409);
  // El resumen sigue a lo escrito, haya o no errores a la vista.
  const end = assignEndDate(start, weeks);

  useEffect(() => {
    if (revealed === 0) return;
    submitRef.current?.focus({ preventScroll: true });
    tailRef.current?.scrollIntoView({ block: 'center' });
  }, [revealed]);

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
        onSuccess: (saved) => {
          // El CU pide confirmar con las fechas y el nombre de la planificación (las del backend).
          toast.success(
            `${saved.planification.name || 'Planificación'} asignada a ${fullName(student)} · del ${formatDate(saved.start_date)} al ${formatDate(saved.end_date)}`,
          );
          navigate(returnTo);
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 409) {
            setOverlap({ key: dates, items: readOverlapping(error.body) });
            setRevealed((count) => count + 1);
          }
        },
      },
    );
  });

  /** Con otras fechas el aviso ya no vale: se vuelve a pedir y el backend dice cuáles se pisan. */
  function clearOverlap() {
    setOverlap(null);
  }

  function changeStart() {
    clearOverlap();
    // El fin fuera del calendario es un error de «Semanas» que depende del inicio: si ese campo ya muestra
    // sus errores, se lo revisa de nuevo para que no quede uno viejo.
    if (getFieldState('weeks').isTouched || isSubmitted) void trigger('weeks');
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
      <Columns>
        <Field label="Fecha de inicio" error={errors.start_date?.message}>
          <Input
            type="date"
            {...register('start_date', { onChange: changeStart })}
          />
        </Field>
        <Field label="Semanas" error={errors.weeks?.message}>
          <Controller
            control={control}
            name="weeks"
            render={({ field }) => (
              <NumberStepper
                {...field}
                label="semanas"
                min={1}
                max={PLAN_WEEKS_MAX}
                placeholder="Ej: 8"
                onChange={(text) => {
                  clearOverlap();
                  field.onChange(capped(text, PLAN_WEEKS_MAX));
                }}
              />
            )}
          />
        </Field>
      </Columns>
      <p className={styles.hint}>{planWeeksHint(plan.duration)}</p>
      <AssignRangeSummary
        start={start}
        end={end}
        weeks={parseCount(weeks)}
        duration={plan.duration}
      />
      <p className={styles.weekOne}>
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
      <div ref={tailRef}>
        {overlapping && (
          <AssignOverlapNote overlapping={overlapping} onRemove={setRemoving} />
        )}
        <Button ref={submitRef} type="submit" loading={assign.isPending}>
          {overlapping ? 'Asignar igual' : 'Asignar planificación'}
        </Button>
      </div>
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
