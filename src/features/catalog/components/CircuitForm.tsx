import { useState } from 'react';
import {
  FormProvider,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { CircuitDetail } from '@/api/pending';
import type { CircuitUsage } from '@/features/catalog/hooks/useCircuits';
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
  activeTypesByName,
  circuitTypeName,
  circuitTypeSaveError,
} from '../circuitTypes';
import {
  queueRoutineOp,
  RESTORE_DRAFT_STATE,
  type CircuitEditorState,
  type RoutineReturn,
} from '../routineDraft';
import {
  circuitCopyBody,
  circuitDefaultValues,
  circuitSchema,
  newCircuitExercise,
  type CircuitInput,
  type CircuitValues,
} from '../circuitSchema';
import { useCircuitTypes } from '../hooks/useCircuitTypes';
import { useSaveCircuit } from '../hooks/useSaveCircuit';
import { useSetCircuitActive } from '../hooks/useSetCircuitActive';
import { CircuitDuplicateModal } from './CircuitDuplicateModal';
import { CircuitExerciseCard } from './CircuitExerciseCard';
import styles from './CircuitForm.module.css';
import { CircuitTypeNotice } from './CircuitTypeNotice';
import { CircuitTypeSelect } from './CircuitTypeSelect';
import { ExercisePickerModal } from './ExercisePickerModal';

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
  /** La ruta del listado de circuitos del rol (`/a/circuitos` o `/c/circuitos`): a donde se vuelve y de donde cuelga el editor. */
  basePath: string;
  /** El circuito a editar. Sin él, el formulario da de alta uno nuevo. */
  circuit?: CircuitDetail;
  /** Las rutinas vigentes que lo usan, si ya se sabe: para avisar que los cambios se aplican en todas. */
  routines?: CircuitUsage[];
  /**
   * La rutina desde la que se abrió el editor, si se abrió desde una. Guardar o dar de baja el circuito
   * vuelve a ella; uno nuevo se suma a la rutina y, al duplicar, la copia reemplaza al original en ella.
   */
  routineReturn?: RoutineReturn;
}

/**
 * El formulario de un circuito, el mismo del Admin y del Entrenador (CU-E-22, CU-E-23 y CU-E-24): nombre, tipo y descripción; los ejercicios
 * en orden, cada uno con su nota y sus bloques de series; y, al editar, duplicar y dar de baja o
 * reactivar. Editar un circuito cambia todas las rutinas que lo usan, y uno dado de baja no se puede
 * editar: primero se lo reactiva.
 *
 * El tipo se elige entre los tipos de circuito activos (BE-44). Al editar, el circuito puede conservar
 * el suyo aunque esté dado de baja, pero una copia no: al duplicarlo se elige otro.
 */
export function CircuitForm({
  basePath,
  circuit,
  routines,
  routineReturn,
}: CircuitFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const save = useSaveCircuit(circuit?.id);
  const duplicate = useSaveCircuit();
  const setActive = useSetCircuitActive();
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState<
    'deactivate' | 'duplicate' | 'duplicate-type' | null
  >(null);
  // Los tipos que se pueden elegir: los activos, por nombre.
  const types = useCircuitTypes();
  const activeTypes = types.data && activeTypesByName(types.data);
  // En el alta hace falta un tipo para elegir: sin ninguno activo, o sin poder pedirlos, no se guarda.
  const noTypeToChoose =
    !circuit && (activeTypes ? activeTypes.length === 0 : types.isError);
  // Si el tipo del original sigue activo, la copia lo conserva. Con la lista de tipos se sabe al día.
  const savedTypeActive =
    circuit &&
    (activeTypes
      ? activeTypes.some(({ id }) => id === circuit.circuit_type.id)
      : circuit.circuit_type.active);

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
  const typeError = save.isError ? circuitTypeSaveError(save.error) : null;
  const exercisesError =
    errors.exercises?.root?.message ?? errors.exercises?.message;
  const usedIn = routines ?? [];

  /** A donde se vuelve al terminar: la rutina de la que se vino, que recupera su borrador, o la lista de circuitos. */
  function leave() {
    if (routineReturn) {
      navigate(routineReturn.to, { state: RESTORE_DRAFT_STATE });
    } else {
      navigate(basePath);
    }
  }

  const onSubmit: SubmitHandler<CircuitValues> = (values) => {
    if (save.isPending || inactive) return;
    save.mutate(values, {
      onSuccess: (saved) => {
        toast.success(circuit ? 'Circuito guardado' : 'Circuito creado');
        // El circuito que se creó desde una rutina se suma a ella cuando se vuelve.
        if (routineReturn && !circuit) {
          queueRoutineOp(routineReturn.routineId, {
            type: 'append',
            circuitId: saved.id,
          });
        }
        leave();
      },
      onError: (error) => {
        // El tipo elegido ya no existe o se dio de baja: se vacía para elegir otro (el hook pide los tipos
        // de nuevo). Lo demás queda escrito.
        if (circuitTypeSaveError(error)) form.setValue('circuit_type_id', '');
      },
    });
  };

  function makeCopy(original: CircuitDetail, circuitTypeId: string) {
    setConfirming(null);
    const body = circuitCopyBody(
      original,
      copyName(original.name),
      circuitTypeId,
    );
    duplicate.mutate(body, {
      onSuccess: (copy) => {
        // Desde una rutina, la copia ocupa el lugar del original en ella; se sigue en la rutina al guardar.
        const slot = routineReturn?.slot;
        if (routineReturn && slot !== undefined) {
          queueRoutineOp(routineReturn.routineId, {
            type: 'replace',
            slot,
            circuitId: copy.id,
          });
        }
        toast.success(
          slot !== undefined
            ? 'Copia creada y reemplazada en esta rutina'
            : 'Circuito duplicado: estás editando la copia',
        );
        const state: CircuitEditorState | undefined = routineReturn && {
          routine: routineReturn,
        };
        navigate(`${basePath}/${copy.id}`, { state });
      },
      onError: (error) =>
        toast.error(circuitTypeSaveError(error) ?? getErrorMessage(error)),
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
          if (!active) leave();
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
            {/* Los del tipo van primero: también son un 404 y un "está dado de baja". */}
            {typeError ??
              (isApiError(save.error) &&
              save.error.serverMessage?.includes(INACTIVE_MESSAGE)
                ? 'El circuito está dado de baja y no se puede editar. Reactivalo primero.'
                : getErrorMessage(save.error, {
                    404:
                      isApiError(save.error) &&
                      save.error.serverMessage === 'Circuito no encontrado'
                        ? 'El circuito ya no existe. Volvé a la lista.'
                        : 'Alguno de los ejercicios ya no existe en el catálogo. Quitalo e intentá de nuevo.',
                  }))}
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
            <CircuitTypeSelect
              actives={activeTypes}
              loading={types.isPending}
              saved={circuit?.circuit_type}
            />
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
          {!inactive && (
            <CircuitTypeNotice
              actives={activeTypes}
              failed={types.isError}
              retrying={types.isRefetching}
              onRetry={() => void types.refetch()}
              isNew={!circuit}
            />
          )}
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
          <Button
            type="submit"
            loading={save.isPending}
            disabled={inactive || noTypeToChoose}
          >
            Guardar circuito
          </Button>
        </fieldset>
        {circuit && (
          <Columns className={styles.secondary}>
            <Button
              variant="sec"
              loading={duplicate.isPending}
              onClick={() =>
                // Con el tipo de baja, siempre se pregunta: hay que elegir el de la copia.
                !savedTypeActive
                  ? setConfirming('duplicate-type')
                  : isDirty
                    ? setConfirming('duplicate')
                    : makeCopy(circuit, circuit.circuit_type.id)
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
            onConfirm={() => makeCopy(circuit, circuit.circuit_type.id)}
            onCancel={() => setConfirming(null)}
          />
          <CircuitDuplicateModal
            open={confirming === 'duplicate-type'}
            circuitName={circuit.name}
            typeName={circuitTypeName(circuit)}
            dirty={isDirty}
            actives={activeTypes}
            failed={types.isError}
            loading={duplicate.isPending}
            onConfirm={(typeId) => makeCopy(circuit, typeId)}
            onCancel={() => setConfirming(null)}
          />
        </>
      )}
    </FormProvider>
  );
}
