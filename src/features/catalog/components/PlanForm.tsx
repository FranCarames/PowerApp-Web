import { useId, useRef, useState, type ReactNode } from 'react';
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

import { usePlanDraftWeeks } from '../hooks/usePlanDraftWeeks';
import { useSavePlanification } from '../hooks/useSavePlanification';
import { planErrorMessage } from '../planErrors';
import {
  draftTotal,
  maxWeekOf,
  parseCount,
  routinesCount,
  toCreateWeeks,
} from '../planRoutines';
import {
  PLAN_PER_WEEK_MAX,
  PLAN_TYPE_SUGGESTIONS,
  PLAN_WEEKS_MAX,
  planDefaultValues,
  planSchema,
  type PlanInput,
  type PlanValues,
} from '../planSchema';
import { PlanDraftWeeks } from './PlanDraftWeeks';
import styles from './PlanForm.module.css';
import { PlanRoutines } from './PlanRoutines';

interface PlanFormProps {
  /** La ruta del listado de planificaciones del rol (`/a/planes` o `/c/planes`): a donde se vuelve y de donde cuelga el editor. */
  basePath: string;
  /** La planificación a editar. Sin ella, el formulario da de alta una nueva. */
  plan?: PlanificationDetail;
  /** Lo que va bajo el botón de guardar: eliminar o reactivar la planificación, al editar. */
  children?: ReactNode;
}

/** El aviso de que la duración no puede bajar de una semana en uso (CU-E-10, y CU-E-09 al armar el alta). */
function shrinkMessage(week: number): string {
  return `El plan tiene rutinas en la semana ${week}: la duración no puede ser menor.`;
}

/** El número como texto, recortado al tope de pantalla: «60» pasa a «52» sin avisar, como el prototipo. */
function capped(text: string, max: number): string {
  return parseCount(text) > max ? String(max) : text;
}

/**
 * La pantalla de una planificación (CU-E-09 a CU-E-12f), la misma del Admin y del Entrenador y la misma para
 * el alta y la edición: a la izquierda los datos (nombre, notas del entrenador, tipo, duración en semanas y
 * rutinas por semana) con el botón, y a la derecha «Semanas del plan», con sus tarjetas. En el celular van
 * apiladas.
 *
 * - **Alta:** las semanas 1 a la duración se arman solas, cada una con tantos huecos como rutinas por semana,
 *   y se rearman en el momento al cambiar cualquiera de los dos campos. Se pueden llenar antes de crear: lo
 *   que se elige vive en la pantalla (`PlanDraftWeeks`) y «Crear planificación» lo manda junto con la
 *   cabecera en un solo pedido, todo o nada. Achicar la duración por debajo de una semana con rutinas se
 *   avisa y la duración queda como estaba.
 * - **Edición:** las semanas son las del plan guardado y sus rutinas se cambian al instante
 *   (`PlanRoutines`); «Guardar planificación» guarda solo la cabecera. Una planificación dada de baja se ve,
 *   pero no se edita: el backend lo rechaza, así que primero se la reactiva.
 *
 * Guardar manda la cabecera completa: los opcionales que quedan vacíos se omiten y el backend los borra. Al
 * guardar una existente se vuelve al listado; al crear una nueva se abre su editor.
 *
 * El botón no está dentro del `<form>` sino asociado a él (`form`): las semanas tienen sus propios modales,
 * y un Enter en uno de sus campos no puede guardar la cabecera.
 */
export function PlanForm({ basePath, plan, children }: PlanFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const formId = useId();
  const save = useSavePlanification(plan?.id);
  const isNew = plan === undefined;

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
  const duration = useWatch({ control, name: 'duration' });
  const perWeekText = useWatch({ control, name: 'number_of_routines' });
  const typedDuration = parseCount(duration);
  const perWeek = parseCount(perWeekText);

  // Las semanas del alta. En la edición no se usa: las semanas son las del plan guardado.
  const draft = usePlanDraftWeeks(
    isNew ? parseCount(defaultValues.duration) : 0,
  );
  // La última duración que dejó las semanas bien armadas, y si el campo tiene el foco (se está escribiendo).
  const acceptedDuration = useRef(defaultValues.duration);
  const durationFocused = useRef(false);
  // La semana con rutinas que frenó el último intento de achicar la duración. Se muestra mientras siga siendo
  // la más alta con rutinas: si se la vacía, el aviso deja de tener sentido.
  const [blockedAt, setBlockedAt] = useState<number | null>(null);
  const blocked = blockedAt !== null && blockedAt === draft.lastUsed;

  const inactive = plan !== undefined && !plan.active;
  const totalChosen = draftTotal(draft.weeks);
  const weeksChosen = draft.weeks.filter((items) => items.length > 0).length;

  /** Escribir la duración en el alta rearma las semanas; una que dejaría rutinas afuera se frena (CU-E-09). */
  function changeDuration(text: string, apply: (text: string) => void) {
    const next = capped(text, PLAN_WEEKS_MAX);
    const weeks = parseCount(next);
    // Vacía o inválida no rearma nada: el error de la duración sale al crear.
    if (!isNew || weeks === 0) {
      setBlockedAt(null);
      apply(next);
      return;
    }
    if (weeks < draft.lastUsed) {
      setBlockedAt(draft.lastUsed);
      // Mientras se escribe, el texto queda (puede ser el comienzo de un número más grande); con los botones − y +,
      // que no tienen el foco en el campo, la duración vuelve a lo que estaba.
      apply(durationFocused.current ? next : acceptedDuration.current);
      return;
    }
    setBlockedAt(null);
    acceptedDuration.current = String(weeks);
    apply(next);
    draft.resize(weeks);
  }

  const onSubmit: SubmitHandler<PlanValues> = (values) => {
    if (save.isPending || inactive) return;
    // El backend rechaza achicar la duración por debajo de una semana en uso: se avisa antes de pedirlo.
    const lastWeek = plan ? maxWeekOf(plan.routines) : draft.lastUsed;
    if (values.duration < lastWeek) {
      setError('duration', { message: shrinkMessage(lastWeek) });
      return;
    }
    const weeks = plan ? [] : toCreateWeeks(draft.weeks);
    save.mutate(weeks.length > 0 ? { ...values, weeks } : values, {
      onSuccess: (saved) => {
        toast.success(plan ? 'Planificación guardada' : 'Planificación creada');
        if (plan) navigate(basePath);
        else navigate(`${basePath}/${saved.id}`, { replace: true });
      },
    });
  };

  return (
    <div className={styles.layout}>
      <form
        id={formId}
        className={styles.data}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
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
          <div className={styles.two}>
            <Field
              label="Duración (semanas)"
              error={
                errors.duration?.message ??
                (blocked ? shrinkMessage(draft.lastUsed) : undefined)
              }
            >
              <Controller
                control={control}
                name="duration"
                render={({ field }) => (
                  <NumberStepper
                    {...field}
                    label="duración (semanas)"
                    min={1}
                    max={PLAN_WEEKS_MAX}
                    placeholder="Ej: 8"
                    onChange={(text) => changeDuration(text, field.onChange)}
                    onFocus={() => {
                      durationFocused.current = true;
                    }}
                    onBlur={() => {
                      durationFocused.current = false;
                      field.onBlur();
                      // Un número frenado no se queda en el campo al salir: vuelve a la duración de las semanas.
                      if (blocked) field.onChange(acceptedDuration.current);
                    }}
                  />
                )}
              />
            </Field>
            <Field
              label="Rutinas por semana"
              error={errors.number_of_routines?.message}
            >
              <Controller
                control={control}
                name="number_of_routines"
                render={({ field }) => (
                  <NumberStepper
                    {...field}
                    label="rutinas por semana"
                    min={1}
                    max={PLAN_PER_WEEK_MAX}
                    placeholder="Ej: 3"
                    onChange={(text) =>
                      field.onChange(capped(text, PLAN_PER_WEEK_MAX))
                    }
                  />
                )}
              />
            </Field>
          </div>
          <p className={styles.hint}>
            {isNew
              ? 'La duración va de 1 semana en adelante, y cada semana tiene los huecos que indiques.'
              : 'La duración va de 1 semana en adelante. Si la cambiás, se mueve el fin de las asignaciones de todos los alumnos que lo tienen.'}
          </p>
        </fieldset>
      </form>
      <div className={styles.weeks}>
        {plan ? (
          <PlanRoutines
            plan={plan}
            perWeek={perWeek}
            typedDuration={typedDuration}
          />
        ) : (
          <PlanDraftWeeks draft={draft} perWeek={perWeek} />
        )}
      </div>
      <div className={styles.acts}>
        <Button
          type="submit"
          form={formId}
          loading={save.isPending}
          disabled={inactive}
        >
          {plan ? 'Guardar planificación' : 'Crear planificación'}
        </Button>
        {isNew && (
          <p className={styles.afterCreate}>
            {totalChosen > 0
              ? `Se crea con ${routinesCount(totalChosen)} en ${weeksChosen} semana${weeksChosen === 1 ? '' : 's'}.`
              : 'Se crea sin rutinas: las semanas se llenan después.'}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
