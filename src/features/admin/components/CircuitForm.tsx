import { useId, useState } from 'react';
import {
  FormProvider,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { CircuitDetail } from '@/api/pending';
import {
  useCircuits,
  type CircuitUsage,
} from '@/features/catalog/hooks/useCircuits';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Columns,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Note,
  SectionHeader,
  useToast,
} from '@/shared/ui';

import {
  circuitCopyBody,
  circuitDefaultValues,
  circuitSchema,
  newCircuitExercise,
  type CircuitInput,
  type CircuitValues,
} from '../circuitSchema';
import { useSaveCircuit } from '../hooks/useSaveCircuit';
import { useSetCircuitActive } from '../hooks/useSetCircuitActive';
import { CircuitExerciseCard } from './CircuitExerciseCard';
import styles from './CircuitForm.module.css';
import { ExercisePickerModal } from './ExercisePickerModal';

const BACK = '/a/circuitos';

/** Lo que agrega `copyName` al nombre. El nombre del circuito llega a 100 caracteres. */
const COPY_SUFFIX = ' (copia)';
const NAME_MAX_LENGTH = 100;

/** El nombre de la copia: el del original más "(copia)", recortado para que entre en el límite. */
function copyName(name: string): string {
  return `${name.slice(0, NAME_MAX_LENGTH - COPY_SUFFIX.length)}${COPY_SUFFIX}`;
}

/** Lo que el backend responde (con el texto de su error) cuando el circuito está dado de baja. */
const INACTIVE_MESSAGE = 'está dado de baja';

interface CircuitFormProps {
  /** El circuito a editar. Sin él, el formulario da de alta uno nuevo. */
  circuit?: CircuitDetail;
  /** Las rutinas vigentes que lo usan, si ya se sabe: para avisar que los cambios se aplican en todas. */
  routines?: CircuitUsage[];
}

/**
 * El formulario de un circuito (CU-E-22, CU-E-23 y CU-E-24): nombre, tipo y descripción; los ejercicios
 * en orden, cada uno con su nota y sus bloques de series; y, al editar, duplicar y dar de baja o
 * reactivar. Editar un circuito cambia todas las rutinas que lo usan, y uno dado de baja no se puede
 * editar: primero se lo reactiva.
 */
export function CircuitForm({ circuit, routines }: CircuitFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const typesId = useId();
  const save = useSaveCircuit(circuit?.id);
  const duplicate = useSaveCircuit();
  const setActive = useSetCircuitActive();
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState<
    'deactivate' | 'duplicate' | null
  >(null);
  // Los tipos que ya existen, para sugerirlos: el tipo es texto libre y "Cardio" y "cardio" convivirían.
  const circuits = useCircuits({ includeInactive: true });
  const knownTypes = [
    ...new Map(
      (circuits.data ?? []).map(({ type }) => [type.toLowerCase(), type]),
    ).values(),
  ];
  // Con los de los demás circuitos alcanza para unificar la escritura: el propio no cuenta, para poder
  // cambiarle las mayúsculas si es el único que tiene ese tipo.
  const othersTypes = (circuits.data ?? [])
    .filter(({ id }) => id !== circuit?.id)
    .map(({ type }) => type);

  const form = useForm<CircuitInput, unknown, CircuitValues>({
    resolver: zodResolver(circuitSchema),
    defaultValues: circuitDefaultValues(circuit),
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = form;
  const exercises = useFieldArray({ control, name: 'exercises' });

  const inactive = circuit !== undefined && !circuit.active;
  const exercisesError =
    errors.exercises?.root?.message ?? errors.exercises?.message;
  const usedIn = routines ?? [];

  const onSubmit: SubmitHandler<CircuitValues> = (values) => {
    if (save.isPending || inactive) return;
    // Si otro circuito ya tiene ese tipo escrito de otra forma ("Core" y "core"), se usa la de ese.
    const type =
      othersTypes.find(
        (known) => known.toLowerCase() === values.type.toLowerCase(),
      ) ?? values.type;
    save.mutate(
      { ...values, type },
      {
        onSuccess: () => {
          toast.success(circuit ? 'Circuito guardado' : 'Circuito creado');
          navigate(BACK);
        },
      },
    );
  };

  function makeCopy(original: CircuitDetail) {
    setConfirming(null);
    duplicate.mutate(circuitCopyBody(original, copyName(original.name)), {
      onSuccess: (copy) => {
        toast.success('Circuito duplicado: estás editando la copia');
        navigate(`${BACK}/${copy.id}`);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function changeActive(target: CircuitDetail, active: boolean) {
    setActive.mutate(
      { id: target.id, active },
      {
        onSuccess: () => {
          toast.success(
            active ? 'Circuito reactivado' : 'Circuito desactivado',
          );
          setConfirming(null);
          // Dar de baja lo saca de la edición; reactivarlo lo deja editable en la misma pantalla.
          if (!active) navigate(BACK);
        },
        onError: (error) => {
          toast.error(
            getErrorMessage(error, { 404: 'El circuito ya no existe.' }),
          );
          setConfirming(null);
        },
      },
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {usedIn.length > 1 && (
          <Note tone="warn" icon="alert">
            Este circuito se usa en {usedIn.length} rutinas (
            {usedIn.map(({ name }) => name).join(', ')}). Los cambios se aplican
            en todas. Si querés cambiarlo solo para una, duplicalo.
          </Note>
        )}
        {inactive && (
          <Note tone="warn" icon="alert">
            Circuito inactivo: no se puede agregar a rutinas nuevas ni editar.
            Reactivalo para poder cambiarlo.
          </Note>
        )}
        {save.isError && (
          <Note tone="err" icon="alert" role="alert">
            {isApiError(save.error) &&
            save.error.serverMessage?.includes(INACTIVE_MESSAGE)
              ? 'El circuito está dado de baja y no se puede editar. Reactivalo primero.'
              : getErrorMessage(save.error, {
                  404:
                    isApiError(save.error) &&
                    save.error.serverMessage === 'Circuito no encontrado'
                      ? 'El circuito ya no existe. Volvé a la lista.'
                      : 'Alguno de los ejercicios ya no existe en el catálogo. Quitalo e intentá de nuevo.',
                })}
          </Note>
        )}
        {/* Un circuito dado de baja se ve, pero no se edita: el backend lo rechaza. */}
        <fieldset disabled={inactive} className={styles.fieldset}>
          <Field label="Nombre del circuito" error={errors.name?.message}>
            <Input
              maxLength={NAME_MAX_LENGTH}
              autoComplete="off"
              placeholder="Ej: Empuje — Principal"
              {...register('name')}
            />
          </Field>
          <Columns>
            <Field
              label="Tipo"
              error={errors.type?.message}
              hint="Texto libre: principal, core…"
            >
              <Input
                maxLength={30}
                autoComplete="off"
                list={typesId}
                placeholder="Ej: principal"
                {...register('type')}
              />
              <datalist id={typesId}>
                {knownTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </Field>
            <Field
              label="Descripción"
              error={errors.description?.message}
              hint="Opcional."
            >
              <Input
                maxLength={100}
                autoComplete="off"
                {...register('description')}
              />
            </Field>
          </Columns>
          <SectionHeader
            level={3}
            title="Ejercicios"
            aside={exercises.fields.length}
          />
          {exercises.fields.length === 0 ? (
            <EmptyState
              icon="dumbbell"
              message="Agregá ejercicios al circuito."
            />
          ) : (
            <div className={styles.list}>
              {exercises.fields.map((field, index) => (
                <CircuitExerciseCard
                  key={field.id}
                  index={index}
                  count={exercises.fields.length}
                  onMove={(direction) =>
                    exercises.move(index, index + direction)
                  }
                  onRemove={() => exercises.remove(index)}
                />
              ))}
            </div>
          )}
          {exercisesError && (
            <div role="alert" className={styles.exercisesError}>
              {exercisesError}
            </div>
          )}
          <Button
            variant="ghost"
            dashed
            icon="plus"
            className={styles.add}
            onClick={() => setPicking(true)}
          >
            Agregar ejercicio
          </Button>
          <Button type="submit" loading={save.isPending} disabled={inactive}>
            Guardar circuito
          </Button>
        </fieldset>
        {circuit && (
          <Columns className={styles.secondary}>
            <Button
              variant="sec"
              loading={duplicate.isPending}
              onClick={() =>
                isDirty ? setConfirming('duplicate') : makeCopy(circuit)
              }
            >
              Duplicar
            </Button>
            {circuit.active ? (
              <Button
                variant="danger"
                onClick={() => setConfirming('deactivate')}
              >
                Desactivar
              </Button>
            ) : (
              <Button
                variant="ghost"
                loading={setActive.isPending}
                onClick={() => changeActive(circuit, true)}
              >
                Reactivar
              </Button>
            )}
          </Columns>
        )}
      </form>
      <ExercisePickerModal
        open={picking}
        selectedIds={exercises.fields.map(({ exercise_id }) => exercise_id)}
        onPick={({ id, name }) => {
          exercises.append(newCircuitExercise(id, name));
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
      {circuit && (
        <>
          <ConfirmDialog
            open={confirming === 'deactivate'}
            destructive
            title="Desactivar circuito"
            message={
              <>
                <b>{circuit.name}</b> deja de estar disponible para rutinas
                nuevas.
                {usedIn.length > 0 &&
                  ` Las ${usedIn.length} rutina${usedIn.length === 1 ? '' : 's'} que ya lo usan lo conservan.`}{' '}
                Es una baja lógica: lo podés reactivar cuando quieras.
              </>
            }
            confirmLabel="Desactivar"
            loading={setActive.isPending}
            onConfirm={() => changeActive(circuit, false)}
            onCancel={() => setConfirming(null)}
          />
          <ConfirmDialog
            open={confirming === 'duplicate'}
            title="Duplicar circuito"
            message={
              <>
                Hay cambios sin guardar. La copia se hace con la versión
                guardada de <b>{circuit.name}</b>, sin ellos, y vas a pasar a
                editarla.
              </>
            }
            confirmLabel="Duplicar"
            onConfirm={() => makeCopy(circuit)}
            onCancel={() => setConfirming(null)}
          />
        </>
      )}
    </FormProvider>
  );
}
