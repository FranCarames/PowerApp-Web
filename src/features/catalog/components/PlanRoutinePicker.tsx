import { useState } from 'react';

import { getErrorMessage } from '@/api/errors';
import type { RoutineListItemPlus } from '@/api/types';
import { matchesSearch } from '@/shared/lib/text';
import {
  Button,
  Chip,
  ChipGroup,
  EmptyState,
  ErrorState,
  Field,
  Input,
  List,
  ListItem,
  ListSkeleton,
  Modal,
  Note,
  NumberStepper,
  Pill,
  SearchInput,
  Tile,
} from '@/shared/ui';

import { PLAN_BULK_MAX } from '../hooks/useAssignPlanRoutines';
import { useRoutines } from '../hooks/useRoutines';
import {
  parseOrder,
  parseWeek,
  routinesCount,
  weekLimit,
} from '../planRoutines';
import { PLAN_WEEK_ROUTINES_MAX } from '../planSchema';
import styles from './PlanRoutinePicker.module.css';

export interface PlanRoutinePick {
  week: number;
  routineIds: string[];
  /** Las mismas rutinas, enteras y en el orden en que se eligieron: el alta las muestra antes de guardarlas. */
  routines: RoutineListItemPlus[];
  /** Solo con una rutina: sin ella, va al final de la semana. */
  order?: number;
}

interface PlanRoutinePickerProps {
  open: boolean;
  /** La duración del plan en semanas (0 es sin duración fija): limita la semana de las rutinas. */
  duration: number;
  /** La semana con la que arranca el campo. */
  defaultWeek: number;
  /**
   * El alta: las rutinas se arman en pantalla, en la semana de la tarjeta que se tocó. No se pide semana ni
   * posición: van al final de esa semana, en el orden en que se eligen.
   */
  draft?: boolean;
  /** Solo en el alta: cuántas rutinas más admite la semana (el máximo es 50 por semana). */
  capacity?: number;
  /** Mientras se agrega: el botón queda ocupado y el modal no se cierra. */
  submitting: boolean;
  /** Por qué falló el último intento, ya en español. */
  error?: string;
  onSubmit: (pick: PlanRoutinePick) => void;
  onClose: () => void;
}

/**
 * Agregar rutinas a una semana del plan (CU-E-12a y CU-E-12b): la semana, la selección de rutinas activas y,
 * si es una sola, su posición dentro de la semana (opcional; sin ella va al final). Con varias, se agregan
 * al final de la semana, consecutivas y en el orden en que se eligieron. Una rutina se puede elegir más de
 * una vez: el plan admite repetirla, y cada vez ocupa su lugar.
 *
 * Se entra desde un hueco de una semana, así que la semana ya viene elegida. En el alta (`draft`) es la de
 * la tarjeta y no se puede cambiar: el selector no pide semana ni posición.
 */
export function PlanRoutinePicker({
  open,
  onClose,
  submitting,
  ...body
}: PlanRoutinePickerProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      blocking={submitting}
      title="Agregar rutinas"
      description={body.draft ? `Semana ${body.defaultWeek}` : undefined}
    >
      {/* El contenido solo existe con el modal abierto: la selección y los campos arrancan de cero cada vez. */}
      {open && (
        <PickerBody onClose={onClose} submitting={submitting} {...body} />
      )}
    </Modal>
  );
}

function PickerBody({
  duration,
  defaultWeek,
  draft = false,
  capacity = PLAN_WEEK_ROUTINES_MAX,
  submitting,
  error,
  onSubmit,
  onClose,
}: Omit<PlanRoutinePickerProps, 'open'>) {
  // La misma lista de todas las rutinas que usa el listado: se filtra acá, y se ofrecen las activas.
  const routines = useRoutines({ includeInactive: true });
  const [week, setWeek] = useState(String(defaultWeek));
  const [order, setOrder] = useState('');
  const [picked, setPicked] = useState<RoutineListItemPlus[]>([]);
  const [search, setSearch] = useState('');
  const [problems, setProblems] = useState<{ week?: string; order?: string }>(
    {},
  );

  const available = routines.data?.filter(({ active }) => active);
  const visible = available?.filter(
    ({ name, coach_note }) =>
      matchesSearch(name, search) || matchesSearch(coach_note ?? '', search),
  );
  const pickedCounts = new Map<string, number>();
  for (const { id } of picked) {
    pickedCounts.set(id, (pickedCounts.get(id) ?? 0) + 1);
  }
  // En el alta lo que entra lo limita la semana (50 en total); al editar, el lote (50 por vez).
  const limit = draft ? Math.min(PLAN_BULK_MAX, capacity) : PLAN_BULK_MAX;
  const full = picked.length >= limit;
  const single = !draft && picked.length === 1;

  function submit() {
    if (draft) {
      onSubmit({
        week: defaultWeek,
        routineIds: picked.map(({ id }) => id),
        routines: picked,
      });
      return;
    }
    const parsedWeek = parseWeek(week, duration);
    // La posición solo vale con una rutina: en el lote no hay forma de mandarla.
    const parsedOrder = single ? parseOrder(order) : { order: undefined };
    setProblems({
      week: 'error' in parsedWeek ? parsedWeek.error : undefined,
      order: 'error' in parsedOrder ? parsedOrder.error : undefined,
    });
    if ('error' in parsedWeek || 'error' in parsedOrder) return;
    onSubmit({
      week: parsedWeek.week,
      routineIds: picked.map(({ id }) => id),
      routines: picked,
      order: parsedOrder.order,
    });
  }

  return (
    <>
      {error && (
        <Note tone="err" icon="alert" role="alert">
          {error}
        </Note>
      )}
      {!draft && (
        <Field
          label="Semana"
          error={problems.week}
          hint={
            duration > 0
              ? `El plan dura ${duration} semana${duration === 1 ? '' : 's'}.`
              : 'El plan no tiene duración fija: va cualquier semana.'
          }
        >
          <NumberStepper
            label="Semana"
            value={week}
            onChange={setWeek}
            min={1}
            max={weekLimit(duration)}
          />
        </Field>
      )}
      {picked.length > 0 && (
        <div className={styles.picked}>
          <div className={styles.pickedTitle}>
            Elegidas, en este orden ({picked.length})
          </div>
          <ChipGroup wrap aria-label="Rutinas elegidas">
            {picked.map(({ id, name }, index) => (
              <Chip
                key={`${id}-${index}`}
                selected
                tone="acc"
                // Una etiqueta con ✕, no un interruptor.
                aria-pressed={undefined}
                aria-label={`Sacar ${name} de la selección`}
                onClick={() =>
                  setPicked((current) => current.filter((_, i) => i !== index))
                }
              >
                {index + 1}. {name} ✕
              </Chip>
            ))}
          </ChipGroup>
        </div>
      )}
      <SearchInput
        placeholder="Buscar rutina"
        value={search}
        maxLength={100}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className={styles.list}>
        {visible ? (
          visible.length === 0 ? (
            <EmptyState
              icon="search"
              message={
                available?.length === 0
                  ? 'No hay rutinas activas. Creá una desde Rutinas.'
                  : 'No hay rutinas con esa búsqueda.'
              }
            />
          ) : (
            <List gap={8}>
              {visible.map((routine) => {
                const times = pickedCounts.get(routine.id) ?? 0;
                return (
                  <ListItem
                    key={routine.id}
                    leading={<Tile icon="list" tone="acc" />}
                    title={routine.name}
                    subtitle={routineSubtitle(routine)}
                    trailing={
                      times > 0 && (
                        <Pill tone="acc">
                          {times === 1 ? 'Elegida' : `Elegida ×${times}`}
                        </Pill>
                      )
                    }
                    onClick={() => {
                      if (!full) setPicked((current) => [...current, routine]);
                    }}
                  />
                );
              })}
            </List>
          )
        ) : routines.isError ? (
          <ErrorState
            message={getErrorMessage(routines.error)}
            onRetry={() => void routines.refetch()}
            retrying={routines.isRefetching}
          />
        ) : (
          <ListSkeleton rows={3} />
        )}
      </div>
      {full && (
        <p className={styles.hint}>
          {draft
            ? `Una semana admite hasta ${PLAN_WEEK_ROUTINES_MAX} rutinas.`
            : `Llegaste al máximo de ${PLAN_BULK_MAX} rutinas por vez.`}
        </p>
      )}
      {single ? (
        <Field
          label="Posición en la semana (opcional)"
          error={problems.order}
          hint="Sin posición, va al final de la semana. Si ya hay otra rutina en esa posición, comparten el lugar."
        >
          <Input
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ej: 1"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          />
        </Field>
      ) : (
        picked.length > (draft ? 0 : 1) && (
          <p className={styles.hint}>
            {draft
              ? `Se agregan al final de la semana ${defaultWeek}, en el orden en que las elegiste.`
              : 'Se agregan al final de la semana, una detrás de otra, en el orden en que las elegiste.'}
          </p>
        )
      )}
      <div className={styles.actions}>
        <Button
          loading={submitting}
          disabled={picked.length === 0}
          onClick={submit}
        >
          {picked.length === 0
            ? 'Elegí una rutina'
            : `Agregar ${routinesCount(picked.length)}`}
        </Button>
        <Button variant="ghost" disabled={submitting} onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </>
  );
}

/** "2 circuitos · la nota" o "Sin circuitos": lo que el listado dice de una rutina. */
function routineSubtitle(routine: RoutineListItemPlus): string {
  const circuits =
    routine.circuit_count === 0
      ? 'Sin circuitos'
      : `${routine.circuit_count} circuito${routine.circuit_count === 1 ? '' : 's'}`;
  return routine.coach_note ? `${circuits} · ${routine.coach_note}` : circuits;
}
