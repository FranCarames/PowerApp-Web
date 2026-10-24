import { useEffect, useMemo, useState } from 'react';
import {
  FormProvider,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { RoutineTree } from '@/api/pending';
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
  Textarea,
  useToast,
} from '@/shared/ui';

import { useCircuitUsage, useCircuits } from '../hooks/useCircuits';
import { useSaveRoutine } from '../hooks/useSaveRoutine';
import { useSetRoutineActive } from '../hooks/useSetRoutineActive';
import {
  clearRoutineStash,
  NEW_ROUTINE_KEY,
  peekRoutineStash,
  stashRoutineDraft,
  type CircuitEditorState,
} from '../routineDraft';
import {
  applyRoutineOps,
  newRoutineCircuit,
  ROUTINE_CIRCUITS_MAX,
  routineDefaultValues,
  routineSchema,
  type RoutineInput,
  type RoutineValues,
} from '../routineSchema';
import { CircuitPickerModal } from './CircuitPickerModal';
import { RoutineCircuitCard } from './RoutineCircuitCard';
import styles from './RoutineForm.module.css';

/**
 * Qué dice un error de guardar la rutina. Los 400 y 404 de la rutina traen su motivo en el texto del
 * servidor ("La rutina … está dada de baja", "El circuito … está dado de baja", "… no pertenece a esta
 * rutina", "Rutina no encontrada"), que se reconoce pero nunca se muestra tal cual.
 */
function saveErrorMessage(error: unknown): string {
  const server = isApiError(error) ? (error.serverMessage ?? '') : '';
  if (server.includes('dada de baja')) {
    return 'La rutina está dada de baja y no se puede editar. Reactivala primero.';
  }
  if (server.includes('dado de baja')) {
    return 'Alguno de los circuitos está dado de baja y no se puede agregar. Quitalo e intentá de nuevo.';
  }
  if (
    server.includes('no pertenece a esta rutina') ||
    server.includes('circuito distinto')
  ) {
    return 'La rutina cambió mientras la editabas. Volvé a abrirla desde la lista.';
  }
  return getErrorMessage(error, {
    404:
      server === 'Rutina no encontrada'
        ? 'La rutina ya no existe. Volvé a la lista.'
        : 'Alguno de los circuitos ya no existe. Quitalo e intentá de nuevo.',
  });
}

/**
 * Los valores con los que arranca el formulario: los de la rutina guardada o, si se vuelve de otra
 * pantalla, lo que había escrito y lo que esa pantalla dejó pendiente (el circuito que creó, la copia).
 */
function initialValues(
  routine: RoutineTree | undefined,
  routineKey: string,
  restoreDraft: boolean,
): RoutineInput {
  const stash = restoreDraft ? peekRoutineStash(routineKey) : undefined;
  return applyRoutineOps(
    stash?.values ?? routineDefaultValues(routine),
    stash?.ops ?? [],
  );
}

interface RoutineFormProps {
  /** La ruta del listado de rutinas del rol (`/a/rutinas` o `/c/rutinas`): a donde se vuelve y de donde cuelga el editor. */
  basePath: string;
  /** La ruta de los circuitos del rol (`/a/circuitos` o `/c/circuitos`): donde se editan y se crean los de la rutina. */
  circuitsPath: string;
  /** La rutina a editar. Sin ella, el formulario da de alta una nueva. */
  routine?: RoutineTree;
  /** Asignar la rutina a un alumno (CU-E-19): es del Entrenador. Sin esto, no hay botón. */
  onAssign?: (routineId: string) => void;
  /** Si se vuelve de otra pantalla (un circuito), el formulario recupera lo que había escrito. */
  restoreDraft?: boolean;
}

/**
 * El formulario de una rutina, el mismo del Admin y del Entrenador (CU-E-16, CU-E-17 y CU-E-18): nombre y
 * nota del entrenador; los circuitos en orden, cada uno con sus ejercicios y las acciones Editar y
 * Quitar; agregar uno existente o crear uno nuevo; y, al editar, eliminar (baja lógica) o reactivar. Guardar
 * manda la lista completa de circuitos con el `id` del vínculo de los que ya estaban. Una rutina dada de baja
 * se ve, pero no se edita: el backend lo rechaza, así que primero se la reactiva.
 *
 * Editar un circuito o crear uno nuevo lleva al editor de circuitos y vuelve acá: lo que ya estaba escrito
 * se guarda en `routineDraft` antes de salir y se recupera al volver. Con `onAssign` (el Entrenador), una
 * rutina vigente suma "Asignar a alumno" junto a "Eliminar", y también se va guardando lo escrito.
 */
export function RoutineForm({
  basePath,
  circuitsPath,
  routine,
  onAssign,
  restoreDraft = false,
}: RoutineFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const save = useSaveRoutine(routine?.id);
  const setActive = useSetRoutineActive();
  const [picking, setPicking] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const routineKey = routine?.id ?? NEW_ROUTINE_KEY;
  const editorPath = `${basePath}/${routineKey}`;

  // Se lee una sola vez, al armar el formulario; lo guardado se descarta enseguida (ya se usó, o se abrió de cero).
  const [defaultValues] = useState(() =>
    initialValues(routine, routineKey, restoreDraft),
  );
  useEffect(() => {
    clearRoutineStash(routineKey);
  }, [routineKey]);

  const form = useForm<RoutineInput, unknown, RoutineValues>({
    resolver: zodResolver(routineSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = form;
  const circuits = useFieldArray({ control, name: 'circuits' });

  // Los circuitos completos que la rutina ya traía, para mostrar sus series. Los que se agregan se piden aparte.
  const details = useMemo(
    () =>
      new Map(routine?.circuits.map(({ circuit }) => [circuit.id, circuit])),
    [routine],
  );
  // Su ficha del listado (la misma lista que usa el selector) y en cuántas rutinas se usa cada uno: si no llegan, la tarjeta no lo dice.
  const catalog = useCircuits({ includeInactive: true });
  const listed = useMemo(
    () => new Map(catalog.data?.map((circuit) => [circuit.id, circuit])),
    [catalog.data],
  );
  const usage = useCircuitUsage();
  const usedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { circuit_id } of circuits.fields) {
      counts.set(circuit_id, (counts.get(circuit_id) ?? 0) + 1);
    }
    return counts;
  }, [circuits.fields]);

  const inactive = routine !== undefined && !routine.active;
  const circuitsError =
    errors.circuits?.root?.message ?? errors.circuits?.message;
  const full = circuits.fields.length >= ROUTINE_CIRCUITS_MAX;

  /** En cuántas rutinas se usa un circuito, contando esta: las otras vigentes que lo tienen, más esta. */
  function routinesUsing(circuitId: string): number | undefined {
    if (!usage.data) return undefined;
    const others = (usage.data.get(circuitId) ?? []).filter(
      ({ id }) => id !== routine?.id,
    );
    return others.length + 1;
  }

  /** Se va al editor de circuitos dejando guardado lo escrito, para volver y encontrarlo. */
  function openCircuitEditor(path: string, slot?: string) {
    stashRoutineDraft(routineKey, getValues());
    const state: CircuitEditorState = {
      routine: { to: editorPath, routineId: routineKey, slot },
    };
    navigate(path, { state });
  }

  /** Se va a asignar la rutina dejando guardado lo escrito: la asignación es de la rutina guardada. */
  function openAssign(target: RoutineTree) {
    stashRoutineDraft(routineKey, getValues());
    onAssign?.(target.id);
  }

  const onSubmit: SubmitHandler<RoutineValues> = (values) => {
    if (save.isPending || inactive) return;
    save.mutate(values, {
      onSuccess: () => {
        toast.success(routine ? 'Rutina guardada' : 'Rutina creada');
        navigate(basePath);
      },
    });
  };

  function changeActive(target: RoutineTree, active: boolean) {
    setActive.mutate(
      { id: target.id, active },
      {
        onSuccess: () => {
          toast.success(active ? 'Rutina reactivada' : 'Rutina eliminada');
          setConfirmingDelete(false);
          // Eliminarla la saca de la edición; reactivarla la deja editable en la misma pantalla.
          if (!active) navigate(basePath);
        },
        onError: (error) => {
          toast.error(
            getErrorMessage(error, { 404: 'La rutina ya no existe.' }),
          );
          setConfirmingDelete(false);
        },
      },
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {inactive && (
          <Note tone="warn" icon="alert">
            Rutina inactiva: no se puede editar ni asignar. Reactivala para
            poder cambiarla.
          </Note>
        )}
        {save.isError && (
          <Note tone="err" icon="alert" role="alert">
            {saveErrorMessage(save.error)}
          </Note>
        )}
        {/* Una rutina dada de baja se ve, pero no se edita: el backend la rechaza. */}
        <fieldset disabled={inactive} className={styles.fieldset}>
          <Field label="Nombre de la rutina" error={errors.name?.message}>
            <Input
              maxLength={50}
              autoComplete="off"
              placeholder="Ej: Día A — Empuje"
              {...register('name')}
            />
          </Field>
          <Field
            label="Nota del coach"
            error={errors.coach_note?.message}
            hint="Opcional. La ve quien hace la rutina."
          >
            <Textarea
              maxLength={100}
              placeholder="Indicaciones para el alumno"
              {...register('coach_note')}
            />
          </Field>
          <SectionHeader
            level={3}
            title="Circuitos"
            aside={circuits.fields.length}
          />
          {circuits.fields.length === 0 ? (
            <EmptyState
              icon="cycle"
              message="La rutina todavía no tiene circuitos. Agregá uno existente o creá uno nuevo."
            />
          ) : (
            <div className={styles.list}>
              {circuits.fields.map((field, index) => (
                <RoutineCircuitCard
                  key={field.id}
                  index={index}
                  count={circuits.fields.length}
                  circuitId={field.circuit_id}
                  detail={details.get(field.circuit_id)}
                  listed={listed.get(field.circuit_id)}
                  routines={routinesUsing(field.circuit_id)}
                  onMove={(direction) =>
                    circuits.move(index, index + direction)
                  }
                  onEdit={() =>
                    openCircuitEditor(
                      `${circuitsPath}/${field.circuit_id}`,
                      field.slot,
                    )
                  }
                  onRemove={() => circuits.remove(index)}
                />
              ))}
            </div>
          )}
          {circuitsError && (
            <div role="alert" className={styles.circuitsError}>
              {circuitsError}
            </div>
          )}
          <Columns className={styles.add}>
            <Button
              variant="ghost"
              icon="plus"
              disabled={full}
              onClick={() => setPicking(true)}
            >
              Agregar existente
            </Button>
            <Button
              variant="ghost"
              icon="plus"
              disabled={full}
              onClick={() => openCircuitEditor(`${circuitsPath}/nuevo`)}
            >
              Nuevo circuito
            </Button>
          </Columns>
          {full && (
            <p className={styles.fullHint}>
              Llegaste al máximo de {ROUTINE_CIRCUITS_MAX} circuitos por rutina.
            </p>
          )}
          <Button type="submit" loading={save.isPending} disabled={inactive}>
            Guardar rutina
          </Button>
        </fieldset>
        {routine &&
          (routine.active ? (
            onAssign ? (
              <Columns className={styles.secondary}>
                <Button variant="sec" onClick={() => openAssign(routine)}>
                  Asignar a alumno
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Eliminar
                </Button>
              </Columns>
            ) : (
              <Button
                variant="danger"
                className={styles.secondary}
                onClick={() => setConfirmingDelete(true)}
              >
                Eliminar rutina
              </Button>
            )
          ) : (
            <Button
              variant="ghost"
              className={styles.secondary}
              loading={setActive.isPending}
              onClick={() => changeActive(routine, true)}
            >
              Reactivar rutina
            </Button>
          ))}
      </form>
      <CircuitPickerModal
        open={picking}
        usedCounts={usedCounts}
        onPick={({ id }) => {
          circuits.append(newRoutineCircuit(id));
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
      {routine && (
        <ConfirmDialog
          open={confirmingDelete}
          destructive
          title="Eliminar rutina"
          message={
            <>
              <b>{routine.name}</b> deja de ofrecerse para planificaciones y
              asignaciones nuevas. Las planificaciones que ya la incluyen y los
              alumnos que ya la tienen la conservan. Es una baja lógica: la
              podés reactivar cuando quieras.
            </>
          }
          confirmLabel="Eliminar"
          loading={setActive.isPending}
          onConfirm={() => changeActive(routine, false)}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </FormProvider>
  );
}
