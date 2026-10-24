import { useMemo, useState } from 'react';

import type { PlanificationAsignation, PlanificationDetail } from '@/api/types';
import {
  Button,
  Columns,
  ConfirmDialog,
  EmptyState,
  List,
  ListItem,
  Pill,
  SectionHeader,
  Tile,
  useToast,
} from '@/shared/ui';

import { useAssignPlanRoutines } from '../hooks/useAssignPlanRoutines';
import { useSetPlanRoutinesActive } from '../hooks/useSetPlanRoutinesActive';
import { planErrorMessage } from '../planErrors';
import { groupByWeek, routinesCount } from '../planRoutines';
import styles from './PlanRoutines.module.css';
import {
  PlanReincorporateModal,
  type PlanPlace,
} from './PlanReincorporateModal';
import { PlanRoutinePicker, type PlanRoutinePick } from './PlanRoutinePicker';
import { PlanRoutineRow } from './PlanRoutineRow';

/** "1 rutina agregada" o "3 rutinas agregadas". */
function addedLabel(count: number): string {
  return `${routinesCount(count)} agregada${count === 1 ? '' : 's'}`;
}

/**
 * Las rutinas de una planificación, por semana (CU-E-12a a CU-E-12d): las vigentes agrupadas por semana
 * con su posición, y las acciones para agregar (una, con su posición opcional, o varias en lote a una
 * semana), quitar (una, o varias que se eligen) y reincorporar (una, a su lugar o a otro, o todas a su
 * lugar). **Cada acción se aplica al instante**: no pasa por "Guardar planificación". Quitar es una baja
 * lógica que conserva el lugar de la rutina y el historial de los alumnos.
 *
 * El detalle del plan trae solo las rutinas vigentes, y ningún endpoint lista las quitadas: las que se
 * quitan en esta pantalla quedan en "Quitadas del plan" para poder reincorporarlas, y se pierden al salir
 * de ella. Con el plan dado de baja se ven las rutinas, pero no se cambian: el backend lo rechaza.
 */
export function PlanRoutines({ plan }: { plan: PlanificationDetail }) {
  const toast = useToast();
  const assign = useAssignPlanRoutines(plan.id);
  const setActive = useSetPlanRoutinesActive();
  const weeks = useMemo(() => groupByWeek(plan.routines), [plan.routines]);
  const inactive = !plan.active;

  const [picker, setPicker] = useState({ open: false, week: 1 });
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [removing, setRemoving] = useState<PlanificationAsignation[] | null>(
    null,
  );
  // Lo que se quitó en esta pantalla: el detalle ya no lo trae, así que acá se guarda para reincorporarlo.
  const [removed, setRemoved] = useState<PlanificationAsignation[]>([]);
  const [reincorporating, setReincorporating] = useState<{
    open: boolean;
    routine: PlanificationAsignation | null;
  }>({ open: false, routine: null });
  const [confirmingAll, setConfirmingAll] = useState(false);

  // Los que se eligieron y siguen en el plan (después de agregar o quitar, la lista cambia).
  const selectedLinks = plan.routines.filter(({ id }) => selected.has(id));
  const lastWeek = weeks.at(-1)?.week ?? 1;
  const duration = plan.duration;

  function openPicker(week: number) {
    assign.reset();
    setPicker({ open: true, week });
  }

  function add({ week, routineIds, order }: PlanRoutinePick) {
    assign.mutate(
      { week, routineIds, order },
      {
        onSuccess: () => {
          toast.success(`${addedLabel(routineIds.length)} a la semana ${week}`);
          setPicker((current) => ({ ...current, open: false }));
        },
      },
    );
  }

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function remove(links: PlanificationAsignation[]) {
    setActive.mutate(
      { ids: links.map(({ id }) => id), active: false },
      {
        onSuccess: () => {
          setRemoved((current) => [...current, ...links]);
          toast.success(
            links.length === 1
              ? 'Rutina quitada del plan'
              : `${routinesCount(links.length)} quitadas del plan`,
          );
          setRemoving(null);
          stopSelecting();
        },
        onError: (error) => {
          toast.error(planErrorMessage(error));
          setRemoving(null);
        },
      },
    );
  }

  function openReincorporate(routine: PlanificationAsignation) {
    setActive.reset();
    setReincorporating({ open: true, routine });
  }

  function reincorporate(routine: PlanificationAsignation, place: PlanPlace) {
    setActive.mutate(
      { ids: [routine.id], active: true, ...place },
      {
        onSuccess: () => {
          setRemoved((current) =>
            current.filter(({ id }) => id !== routine.id),
          );
          toast.success('Rutina reincorporada al plan');
          setReincorporating((current) => ({ ...current, open: false }));
        },
      },
    );
  }

  function reincorporateAll() {
    const ids = removed.map(({ id }) => id);
    setActive.mutate(
      { ids, active: true },
      {
        onSuccess: () => {
          setRemoved([]);
          toast.success(`${routinesCount(ids.length)} reincorporadas al plan`);
          setConfirmingAll(false);
        },
        onError: (error) => {
          toast.error(planErrorMessage(error));
          setConfirmingAll(false);
        },
      },
    );
  }

  return (
    <>
      <SectionHeader
        level={3}
        title="Rutinas del plan"
        aside={
          <Pill
            tone={plan.routine_count === plan.number_of_routines ? 'ok' : 'acc'}
            title={`${plan.routine_count} rutinas asignadas de ${plan.number_of_routines} previstas`}
          >
            {plan.routine_count} de {routinesCount(plan.number_of_routines)}
          </Pill>
        }
      />
      <p className={styles.hint}>
        Los cambios de esta sección se aplican al instante, sin pasar por
        “Guardar planificación”.{' '}
        {duration > 0
          ? `El plan dura ${duration} semana${duration === 1 ? '' : 's'}: las rutinas van de la semana 1 a la ${duration}.`
          : 'El plan no tiene duración fija: las rutinas pueden ir en cualquier semana.'}
      </p>
      {weeks.length === 0 ? (
        <EmptyState
          icon="list"
          message="El plan todavía no tiene rutinas. Agregalas por semana."
        />
      ) : (
        weeks.map(({ week, routines }) => (
          <section
            key={week}
            aria-labelledby={`plan-week-${week}`}
            className={styles.week}
          >
            <div className={styles.weekHead}>
              <h4 id={`plan-week-${week}`} className={styles.weekTitle}>
                Semana {week}
              </h4>
              <span className={styles.weekCount}>
                {routinesCount(routines.length)}
              </span>
              {!selecting && (
                <Button
                  variant="ghost"
                  sm
                  icon="plus"
                  disabled={inactive}
                  aria-label={`Agregar rutinas a la semana ${week}`}
                  onClick={() => openPicker(week)}
                >
                  Agregar
                </Button>
              )}
            </div>
            <List gap={8}>
              {routines.map((link) => (
                <PlanRoutineRow
                  key={link.id}
                  link={link}
                  disabled={inactive}
                  selecting={selecting}
                  selected={selected.has(link.id)}
                  onToggle={() => toggle(link.id)}
                  onRemove={() => {
                    setActive.reset();
                    setRemoving([link]);
                  }}
                />
              ))}
            </List>
          </section>
        ))
      )}
      {selecting ? (
        <Columns className={styles.actions}>
          <Button variant="ghost" onClick={stopSelecting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            disabled={selectedLinks.length === 0}
            onClick={() => {
              setActive.reset();
              setRemoving(selectedLinks);
            }}
          >
            Quitar{selectedLinks.length > 0 && ` (${selectedLinks.length})`}
          </Button>
        </Columns>
      ) : (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            dashed
            icon="plus"
            disabled={inactive}
            onClick={() => openPicker(lastWeek)}
          >
            Agregar rutinas
          </Button>
          {plan.routines.length > 1 && (
            <Button
              variant="ghost"
              disabled={inactive}
              onClick={() => setSelecting(true)}
            >
              Elegir varias para quitar
            </Button>
          )}
        </div>
      )}
      {removed.length > 0 && (
        <section aria-label="Quitadas del plan" className={styles.week}>
          <SectionHeader
            level={4}
            title="Quitadas del plan"
            aside={removed.length}
          />
          <p className={styles.hint}>
            Volvés a ponerlas desde acá, a su lugar o a otro. Cuando salgas de
            esta pantalla ya no las vas a ver: para sumarlas de nuevo vas a
            tener que agregarlas.
          </p>
          <List gap={8}>
            {removed.map((link) => (
              <ListItem
                key={link.id}
                leading={<Tile icon="list" tone="mut" />}
                title={link.routine.name}
                subtitle={`Semana ${link.week} · Posición ${link.order}`}
                trailing={
                  <Button
                    variant="ghost"
                    sm
                    disabled={inactive}
                    aria-label={`Reincorporar ${link.routine.name}`}
                    onClick={() => openReincorporate(link)}
                  >
                    Reincorporar
                  </Button>
                }
              />
            ))}
          </List>
          {removed.length > 1 && (
            <Button
              variant="ghost"
              className={styles.all}
              disabled={inactive}
              onClick={() => {
                setActive.reset();
                setConfirmingAll(true);
              }}
            >
              Reincorporar todas a su lugar
            </Button>
          )}
        </section>
      )}
      <PlanRoutinePicker
        open={picker.open}
        duration={duration}
        defaultWeek={picker.week}
        submitting={assign.isPending}
        error={assign.isError ? planErrorMessage(assign.error) : undefined}
        onSubmit={add}
        onClose={() => setPicker((current) => ({ ...current, open: false }))}
      />
      <PlanReincorporateModal
        open={reincorporating.open}
        routine={reincorporating.routine}
        duration={duration}
        submitting={setActive.isPending}
        error={
          reincorporating.open && setActive.isError
            ? planErrorMessage(setActive.error)
            : undefined
        }
        onSubmit={(place) => {
          if (reincorporating.routine) {
            reincorporate(reincorporating.routine, place);
          }
        }}
        onClose={() =>
          setReincorporating((current) => ({ ...current, open: false }))
        }
      />
      <ConfirmDialog
        open={removing !== null}
        destructive
        title={
          removing?.length === 1
            ? 'Quitar rutina del plan'
            : `Quitar ${routinesCount(removing?.length ?? 0)} del plan`
        }
        message={
          removing?.length === 1 ? (
            <>
              <b>{removing[0]?.routine.name}</b> sale de la semana{' '}
              {removing[0]?.week} del plan. Es una baja lógica: conserva su
              lugar y los alumnos que ya la entrenaron conservan su historial.
              Mientras no cierres esta pantalla, la podés reincorporar desde
              “Quitadas del plan”.
            </>
          ) : (
            <>
              Las rutinas elegidas salen del plan. Es una baja lógica: cada una
              conserva su lugar y los alumnos que ya las entrenaron conservan su
              historial. Mientras no cierres esta pantalla, las podés
              reincorporar desde “Quitadas del plan”.
            </>
          )
        }
        confirmLabel="Quitar"
        loading={setActive.isPending}
        onConfirm={() => {
          if (removing) remove(removing);
        }}
        onCancel={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={confirmingAll}
        icon="refresh"
        tone="acc"
        title="Reincorporar rutinas"
        message={`Las ${removed.length} rutinas quitadas vuelven al plan, cada una a su semana y su posición de antes. Si la duración del plan se achicó y alguna quedó en una semana que ya no existe, no vuelve ninguna: en ese caso reincorporalas de a una.`}
        confirmLabel="Reincorporar"
        loading={setActive.isPending}
        onConfirm={reincorporateAll}
        onCancel={() => setConfirmingAll(false)}
      />
    </>
  );
}
