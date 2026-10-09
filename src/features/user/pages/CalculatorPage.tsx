import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { getErrorMessage, isApiError } from '@/api/errors';
import { useExercises } from '@/features/catalog/hooks/useExercises';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Columns,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
} from '@/shared/ui';

import { PotentialRmResult } from '../components/PotentialRmResult';
import { usePotentialRms } from '../hooks/usePotentialRms';
import {
  potentialRmSchema,
  type PotentialRmInput,
  type PotentialRmValues,
} from '../schemas';
import styles from './CalculatorPage.module.css';

/** Cuánto se espera sin que cambie un campo antes de calcular. */
const CALCULATE_DELAY_MS = 400;
/** Epley pierde precisión más allá de las 12 repeticiones (la tabla del backend llega hasta ahí). */
const PRECISE_REPS = 12;

/**
 * Calculadora de RM (CU-U-16): el ejercicio, el peso y el máximo de repeticiones logradas con ese
 * peso dan el 1RM estimado y la tabla de 1RM a 12RM (`POST /user_rm/potential`). El resultado se
 * calcula solo, un momento después de que los tres datos son válidos, y nunca se guarda.
 */
export function CalculatorPage() {
  const exercises = useExercises();
  const options = useMemo(
    () =>
      exercises.data
        ?.map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [exercises.data],
  );

  const {
    register,
    control,
    formState: { errors },
  } = useForm<PotentialRmInput, unknown, PotentialRmValues>({
    resolver: zodResolver(potentialRmSchema),
    mode: 'onChange',
    defaultValues: { exercise_id: '', weight: '', max_reps: '' },
  });
  const [exerciseId, weight, maxReps] = useWatch({
    control,
    name: ['exercise_id', 'weight', 'max_reps'],
  });

  // Los tres datos válidos, o `null`. Cambia de identidad solo cuando cambia un campo.
  const parsed = useMemo(
    () =>
      potentialRmSchema.safeParse({
        exercise_id: exerciseId,
        weight,
        max_reps: maxReps,
      }),
    [exerciseId, weight, maxReps],
  );
  const valid = parsed.success ? parsed.data : null;
  const debounced = useDebouncedValue(valid, CALCULATE_DELAY_MS);
  // Si dejó de ser válido, no se pide nada ni se muestra un cálculo viejo.
  const query = usePotentialRms(valid ? debounced : null);
  const waiting = valid !== null && debounced !== valid;

  const manyReps = Number(maxReps) > PRECISE_REPS;

  let result;
  if (exercises.isError) {
    result = (
      <ErrorState
        message={getErrorMessage(exercises.error)}
        onRetry={() => void exercises.refetch()}
        retrying={exercises.isRefetching}
      />
    );
  } else if (query.isError) {
    // Con un 404 el ejercicio ya no existe: reintentar no sirve, hay que elegir otro.
    const exerciseGone = isApiError(query.error) && query.error.status === 404;
    result = (
      <ErrorState
        title={exerciseGone ? 'No encontramos el ejercicio' : undefined}
        message={getErrorMessage(query.error, {
          404: 'Ese ejercicio ya no existe. Elegí otro.',
        })}
        onRetry={exerciseGone ? undefined : () => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  } else {
    result = (
      <PotentialRmResult
        result={valid ? query.data : undefined}
        stale={waiting || (query.isFetching && query.isPlaceholderData)}
        loading={valid !== null && query.data === undefined}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Estimá tu máximo"
        title="Calculadora RM"
        back="/u/rms"
      />
      <div className={styles.narrow}>
        <p className={styles.intro}>
          Ingresá el peso que levantaste y las repeticiones para estimar tu
          repetición máxima. Es una estimación: no se guarda en tus RMs.
        </p>
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <Field label="Ejercicio" error={errors.exercise_id?.message}>
            <Select
              {...register('exercise_id')}
              disabled={options === undefined}
            >
              <option value="">
                {options ? 'Elegí un ejercicio' : 'Cargando ejercicios…'}
              </option>
              {options?.map((exercise) => (
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
                {...register('weight')}
              />
            </Field>
            <Field
              label="Repeticiones"
              error={errors.max_reps?.message}
              hint={
                manyReps
                  ? `Con más de ${PRECISE_REPS} repeticiones la estimación pierde precisión.`
                  : undefined
              }
            >
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max="100"
                step="1"
                {...register('max_reps')}
              />
            </Field>
          </Columns>
        </form>
        {result}
      </div>
    </>
  );
}
