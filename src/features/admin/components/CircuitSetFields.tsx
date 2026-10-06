import { useFormContext, useWatch } from 'react-hook-form';

import { formatSetBlock } from '@/shared/lib/sets';
import { Chip, Columns, Field, IconButton, Input, Select } from '@/shared/ui';

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

/** Un valor del formulario como número, o `undefined` si todavía no es uno válido (para el resumen). */
function toNumber(text: string): number | undefined {
  const value = Number(text.replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(value) ? value : undefined;
}

/**
 * Un bloque de series de un ejercicio, con todos sus campos a la vista: series y repeticiones, peso,
 * intensidad (RPE o RIR, uno u otro), % del RM, AMRAP con su tiempo y RM. Una fila es un bloque de series
 * iguales: 3 series de 8 repeticiones son un bloque. El encabezado lo resume en una línea.
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
    control,
    formState: { errors },
  } = useFormContext<CircuitInput>();
  const base = `exercises.${exerciseIndex}.sets.${setIndex}` as const;
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

  function toggle(name: 'amrap' | 'rm') {
    setValue(`${base}.${name}`, !values[name], {
      shouldDirty: true,
      shouldValidate: true,
    });
    // El tiempo solo vale con AMRAP: al apagarlo, se vacía.
    if (name === 'amrap' && values.amrap) {
      setValue(`${base}.amrap_time`, '', { shouldDirty: true });
    }
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
      <Columns>
        <Field label="Series" error={fieldErrors?.set_count?.message}>
          <Input
            inputMode="numeric"
            maxLength={2}
            autoComplete="off"
            {...register(`${base}.set_count`)}
          />
        </Field>
        <Field
          label="Repeticiones"
          error={fieldErrors?.rep_count?.message}
          hint={values.amrap ? 'Objetivo. 1 = sin objetivo' : undefined}
        >
          <Input
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            {...register(`${base}.rep_count`)}
          />
        </Field>
      </Columns>
      <Columns>
        <Field label="Peso (kg)" error={fieldErrors?.weight?.message}>
          <Input
            inputMode="decimal"
            maxLength={7}
            autoComplete="off"
            placeholder="Opcional"
            {...register(`${base}.weight`)}
          />
        </Field>
        <Field label="% del RM" error={fieldErrors?.rm_perc?.message}>
          <Input
            inputMode="numeric"
            maxLength={3}
            autoComplete="off"
            placeholder="Opcional"
            {...register(`${base}.rm_perc`)}
          />
        </Field>
      </Columns>
      <Columns>
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
        <Field
          label={values.effort === 'none' ? 'Valor' : effortLabel}
          error={fieldErrors?.effort_value?.message}
        >
          <Input
            inputMode="numeric"
            maxLength={2}
            autoComplete="off"
            disabled={values.effort === 'none'}
            {...register(`${base}.effort_value`)}
          />
        </Field>
      </Columns>
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
        <Field
          label="Tiempo del AMRAP (segundos)"
          error={fieldErrors?.amrap_time?.message}
          hint="Opcional. Vacío: hasta el fallo."
        >
          <Input
            inputMode="numeric"
            maxLength={5}
            autoComplete="off"
            {...register(`${base}.amrap_time`)}
          />
        </Field>
      )}
    </div>
  );
}
