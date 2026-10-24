import { useState } from 'react';
import {
  Controller,
  useForm,
  useWatch,
  type SubmitHandler,
} from 'react-hook-form';
import { useNavigate } from 'react-router';

import type { PlanificationDetail } from '@/api/types';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Chip,
  ChipGroup,
  Field,
  Input,
  Note,
  NumberStepper,
  Textarea,
  useToast,
} from '@/shared/ui';

import { useSavePlanification } from '../hooks/useSavePlanification';
import { planErrorMessage } from '../planErrors';
import { maxWeekOf } from '../planRoutines';
import {
  PLAN_INT_MAX,
  PLAN_TYPE_SUGGESTIONS,
  planDefaultValues,
  planSchema,
  type PlanInput,
  type PlanValues,
} from '../planSchema';
import styles from './PlanForm.module.css';

interface PlanFormProps {
  /** La ruta del listado de planificaciones del rol (`/a/planes` o `/c/planes`): a donde se vuelve y de donde cuelga el editor. */
  basePath: string;
  /** La planificación a editar. Sin ella, el formulario da de alta una nueva. */
  plan?: PlanificationDetail;
}

/**
 * La cabecera de una planificación, la misma del Admin y del Entrenador (CU-E-09 y CU-E-10): nombre, notas
 * del entrenador (la `description` del contrato), tipo, duración en semanas y las rutinas previstas.
 * Guardar manda la cabecera completa: los opcionales que quedan vacíos se omiten y el backend los borra.
 * Las rutinas del plan no viajan acá: se cambian aparte, al instante (`PlanRoutines`). Una planificación
 * dada de baja se ve, pero no se edita: el backend lo rechaza, así que primero se la reactiva.
 *
 * Al guardar una existente se vuelve al listado; al crear una nueva se abre su editor, donde ya se le
 * pueden agregar rutinas.
 */
export function PlanForm({ basePath, plan }: PlanFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const save = useSavePlanification(plan?.id);

  // Se lee una sola vez, al armar el formulario: lo que cambie el plan después (sus rutinas) no pisa lo escrito.
  const [defaultValues] = useState(() => planDefaultValues(plan));
  const form = useForm<PlanInput, unknown, PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = form;
  const type = useWatch({ control, name: 'type' });

  const inactive = plan !== undefined && !plan.active;

  const onSubmit: SubmitHandler<PlanValues> = (values) => {
    if (save.isPending || inactive) return;
    // El backend rechaza achicar la duración por debajo de una semana en uso: se avisa antes de pedirlo.
    const maxWeek = maxWeekOf(plan?.routines ?? []);
    if (values.duration > 0 && values.duration < maxWeek) {
      setError('duration', {
        message: `El plan tiene rutinas en la semana ${maxWeek}: la duración no puede ser menor.`,
      });
      return;
    }
    save.mutate(values, {
      onSuccess: (saved) => {
        toast.success(plan ? 'Planificación guardada' : 'Planificación creada');
        if (plan) navigate(basePath);
        else navigate(`${basePath}/${saved.id}`, { replace: true });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {save.isError && (
        <Note tone="err" icon="alert" role="alert">
          {planErrorMessage(save.error)}
        </Note>
      )}
      {/* Una planificación dada de baja se ve, pero no se edita: el backend la rechaza. */}
      <fieldset disabled={inactive} className={styles.fieldset}>
        <Field label="Nombre del plan" error={errors.name?.message}>
          <Input
            maxLength={50}
            autoComplete="off"
            placeholder="Ej: Fuerza 5×5 — Avanzado"
            {...register('name')}
          />
        </Field>
        <Field
          label="Notas del entrenador"
          error={errors.description?.message}
          hint="Opcional. Objetivos y observaciones."
        >
          <Textarea
            maxLength={1000}
            placeholder="Objetivos y observaciones"
            {...register('description')}
          />
        </Field>
        <Field
          label="Tipo de plan"
          error={errors.type?.message}
          hint="Opcional. Elegí uno o escribí el tuyo."
        >
          <ChipGroup wrap aria-label="Tipos sugeridos">
            {PLAN_TYPE_SUGGESTIONS.map((suggestion) => {
              const selected =
                type.trim().toLowerCase() === suggestion.toLowerCase();
              return (
                <Chip
                  key={suggestion}
                  selected={selected}
                  onClick={() =>
                    setValue('type', selected ? '' : suggestion, {
                      shouldDirty: true,
                    })
                  }
                >
                  {suggestion}
                </Chip>
              );
            })}
          </ChipGroup>
          <Input
            maxLength={30}
            autoComplete="off"
            placeholder="Otro tipo"
            {...register('type')}
          />
        </Field>
        <Field
          label="Duración (semanas)"
          error={errors.duration?.message}
          hint="0 si el plan no tiene duración fija. Si la cambiás, se mueve el fin de las asignaciones de todos los alumnos que lo tienen."
        >
          <Controller
            control={control}
            name="duration"
            render={({ field }) => (
              <NumberStepper
                {...field}
                label="Duración en semanas"
                min={0}
                max={PLAN_INT_MAX}
              />
            )}
          />
        </Field>
        <Field
          label="Rutinas previstas"
          error={errors.number_of_routines?.message}
          hint="Cuántas rutinas va a tener el plan. Las que ya tiene asignadas se cuentan aparte."
        >
          <Controller
            control={control}
            name="number_of_routines"
            render={({ field }) => (
              <NumberStepper
                {...field}
                label="Rutinas previstas"
                min={1}
                max={PLAN_INT_MAX}
                placeholder="Ej: 3"
              />
            )}
          />
        </Field>
        <Button type="submit" loading={save.isPending} disabled={inactive}>
          Guardar planificación
        </Button>
        {!plan && (
          <p className={styles.afterCreate}>
            Cuando la crees vas a poder agregarle sus rutinas, semana por
            semana.
          </p>
        )}
      </fieldset>
    </form>
  );
}
