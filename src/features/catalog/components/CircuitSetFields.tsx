import type { ComponentProps } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { formatSetBlock } from '@/shared/lib/sets';
import { Chip, Field, IconButton, NumberStepper, Select } from '@/shared/ui';

import type { CircuitInput } from '../circuitSchema';
import styles from './CircuitSetFields.module.css';

interface CircuitSetFieldsProps {
  exerciseIndex: number;
  setIndex: number;
  /** El nombre del ejercicio, para los nombres accesibles de los botones. */
  exerciseName: string;
  /** Un ejercicio necesita al menos un bloque: con uno solo, no se puede quitar. */
  canRemove: boolean;
  onRemove: () => void;
}

type SetBase = `exercises.${number}.sets.${number}`;

/** Un valor del formulario como número, o `undefined` si todavía no es uno válido (para el resumen). */
function toNumber(text: string): number | undefined {
  const value = Number(text.replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(value) ? value : undefined;
}

type StepperFieldProps = Omit<
  ComponentProps<typeof NumberStepper>,
  'name' | 'value' | 'onChange'
> & {
  base: SetBase;
  name:
    | 'set_count'
    | 'rep_count'
    | 'weight'
    | 'rm_perc'
    | 'effort_value'
    | 'amrap_time';
  /** A qué bloque pertenece, para los nombres accesibles de los botones: "bloque 1 de Sentadilla". */
  owner: string;
  error?: string;
  hint?: string;
};

/** Un campo numérico del bloque, con su etiqueta y los botones − y +. */
function StepperField({
  base,
  name,
  label,
  owner,
  error,
  hint,
  ...stepper
}: StepperFieldProps) {
  const { control } = useFormContext<CircuitInput>();

  return (
    <Field label={label} error={error} hint={hint}>
      <Controller
        control={control}
        name={`${base}.${name}`}
        render={({ field }) => (
          <NumberStepper {...field} label={`${label}, ${owner}`} {...stepper} />
        )}
      />
    </Field>
  );
}

/**
 * Un bloque de series de un ejercicio, con todos sus campos a la vista: series y repeticiones, peso,
 * intensidad (RPE o RIR, uno u otro), % del RM, AMRAP con su tiempo y RM. Una fila es un bloque de series
 * iguales: 3 series de 8 repeticiones son un bloque. El encabezado lo resume en una línea.
 * Los números se ajustan con los botones − y +, o escribiéndolos.
 */
export function CircuitSetFields({
  exerciseIndex,
  setIndex,
  exerciseName,
  canRemove,
  onRemove,
}: CircuitSetFieldsProps) {
  const {
    register,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = useFormContext<CircuitInput>();
  const base: SetBase = `exercises.${exerciseIndex}.sets.${setIndex}`;
  const owner = `bloque ${setIndex + 1} de ${exerciseName}`;
  const fieldErrors = errors.exercises?.[exerciseIndex]?.sets?.[setIndex];
  const values = useWatch({ control, name: base });

  const summary = formatSetBlock({
    set_count: toNumber(values.set_count) ?? 0,
    rep_count: toNumber(values.rep_count) ?? 0,
    weight: toNumber(values.weight),
    rpe: values.effort === 'rpe' ? toNumber(values.effort_value) : undefined,
    rir: values.effort === 'rir' ? toNumber(values.effort_value) : undefined,
    rm_perc: toNumber(values.rm_perc),
    amrap: values.amrap,
    amrap_time: toNumber(values.amrap_time),
    rm: values.rm,
  });
  const effortLabel = values.effort === 'rir' ? 'RIR (0 a 10)' : 'RPE (1 a 10)';
  const effortRange: [number, number] =
    values.effort === 'rir' ? [0, 10] : [1, 10];

  function toggle(name: 'amrap' | 'rm') {
    const turningOn = !values[name];
    setValue(`${base}.${name}`, turningOn, { shouldDirty: true });
    if (turningOn) {
      // Un AMRAP y un intento de RM son una sola serie, y con 1 repetición el AMRAP queda "sin objetivo":
      // arrancan en 1×1 y después se pueden cambiar.
      setValue(`${base}.set_count`, '1', { shouldDirty: true });
      setValue(`${base}.rep_count`, '1', { shouldDirty: true });
    } else if (name === 'amrap') {
      // El tiempo solo vale con AMRAP: al apagarlo, se vacía.
      setValue(`${base}.amrap_time`, '', { shouldDirty: true });
    }
    void trigger(
      turningOn
        ? [`${base}.set_count`, `${base}.rep_count`, `${base}.${name}`]
        : `${base}.${name}`,
    );
  }

  return (
    <div className={styles.block}>
      <div className={styles.head}>
        <div className={styles.title}>
          <span className={styles.number}>Bloque {setIndex + 1}</span>
          <span className={styles.summary}>{summary}</span>
        </div>
        {canRemove && (
          <IconButton
            variant="ghost"
            danger
            icon="x"
            label={`Quitar el bloque ${setIndex + 1} de ${exerciseName}`}
            onClick={onRemove}
          />
        )}
      </div>
      <div className={styles.grid}>
        <StepperField
          base={base}
          name="set_count"
          label="Series"
          owner={owner}
          error={fieldErrors?.set_count?.message}
          min={1}
          max={20}
          maxLength={2}
        />
        <StepperField
          base={base}
          name="rep_count"
          label="Repeticiones"
          owner={owner}
          error={fieldErrors?.rep_count?.message}
          hint={values.amrap ? 'Objetivo. 1 = sin objetivo' : undefined}
          min={1}
          max={1000}
          maxLength={4}
        />
      </div>
      <div className={styles.grid}>
        <StepperField
          base={base}
          name="weight"
          label="Peso (kg)"
          owner={owner}
          error={fieldErrors?.weight?.message}
          min={0.01}
          max={1000}
          step={2.5}
          decimals={2}
          optional
          maxLength={7}
          placeholder="Opcional"
        />
        <StepperField
          base={base}
          name="rm_perc"
          label="% del RM"
          owner={owner}
          error={fieldErrors?.rm_perc?.message}
          min={1}
          max={125}
          step={5}
          optional
          maxLength={3}
          placeholder="Opcional"
        />
      </div>
      <div className={styles.grid}>
        <Field label="Intensidad">
          <Select
            {...register(`${base}.effort`, {
              // Cambiar de escala (o sacarla) no arrastra el valor de la anterior.
              onChange: () =>
                setValue(`${base}.effort_value`, '', { shouldDirty: true }),
            })}
          >
            <option value="none">Ninguna</option>
            <option value="rpe">RPE</option>
            <option value="rir">RIR</option>
          </Select>
        </Field>
        <StepperField
          base={base}
          name="effort_value"
          label={values.effort === 'none' ? 'Valor' : effortLabel}
          owner={owner}
          error={fieldErrors?.effort_value?.message}
          min={effortRange[0]}
          max={effortRange[1]}
          maxLength={2}
          disabled={values.effort === 'none'}
        />
      </div>
      <div className={styles.flags}>
        <Chip
          tone="acc"
          selected={values.amrap}
          onClick={() => toggle('amrap')}
        >
          AMRAP
        </Chip>
        <Chip tone="acc" selected={values.rm} onClick={() => toggle('rm')}>
          RM
        </Chip>
      </div>
      {fieldErrors?.rm?.message && (
        <div role="alert" className={styles.flagError}>
          {fieldErrors.rm.message}
        </div>
      )}
      {values.amrap && (
        <StepperField
          base={base}
          name="amrap_time"
          label="Tiempo del AMRAP (segundos)"
          owner={owner}
          error={fieldErrors?.amrap_time?.message}
          hint="Opcional. Vacío: hasta el fallo."
          min={1}
          max={99_999}
          step={10}
          optional
          maxLength={5}
        />
      )}
    </div>
  );
}
