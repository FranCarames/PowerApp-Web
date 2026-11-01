import { useId, useMemo, useState } from 'react';

import type { PlanificationAsignation, PlanificationDetail } from '@/api/types';
import {
  Button,
  Columns,
  ConfirmDialog,
  EmptyState,
  List,
  ListItem,
  SectionHeader,
  Tile,
  useToast,
} from '@/shared/ui';

import { useAssignPlanRoutines } from '../hooks/useAssignPlanRoutines';
import { useRepeatPlanWeek } from '../hooks/useRepeatPlanWeek';
import { useReorderPlanWeek } from '../hooks/useReorderPlanWeek';
import { useSetPlanRoutinesActive } from '../hooks/useSetPlanRoutinesActive';
import { planErrorMessage } from '../planErrors';
import { moveItem, routinesCount, savedWeeks } from '../planRoutines';
import styles from './PlanRoutines.module.css';
import {
  PlanReincorporateModal,
  type PlanPlace,
} from './PlanReincorporateModal';
import { PlanRepeatModal } from './PlanRepeatModal';
import { PlanRoutinePicker, type PlanRoutinePick } from './PlanRoutinePicker';
import { PlanWeekCard, type MoveHow } from './PlanWeekCard';
import { PlanWeeksSection } from './PlanWeeksSection';

interface PlanRoutinesProps {
  plan: PlanificationDetail;
  /** Las rutinas por semana que hay escritas en el formulario ahora: los huecos siguen ese número, guardado o no. */
  perWeek: number;
  /** La duración que hay escrita en el formulario ahora (0 si no es un número válido). Las semanas siguen la guardada. */
  typedDuration: number;
}

/** "1 rutina agregada" o "3 rutinas agregadas". */
function addedLabel(count: number): string {
  return `${routinesCount(count)} agregada${count === 1 ? '' : 's'}`;
}

/**
 * Las semanas de una planificación guardada y sus rutinas (CU-E-12a a CU-E-12f): todas las semanas de su
 * duración, vacías incluidas, cada una con sus rutinas vigentes y los huecos que faltan para llegar a las
 * rutinas por semana. **Cada acción se aplica al instante**, con su pedido: agregar (desde un hueco, una
 * rutina o varias), quitar (una, o varias que se eligen), reincorporar, **reordenar** una semana con el
 * grabber de sus rutinas y **repetir** una semana en otras. Nada pasa por «Guardar planificación». Quitar es
 * una baja lógica que conserva el lugar de la rutina y el historial de los alumnos.
 *
 * Las semanas siguen la duración **guardada** del plan: si se escribe otra en el formulario, la pantalla avisa
 * que se ajustan al guardar. Los huecos, en cambio, siguen el número de rutinas por semana escrito, porque son
 * solo visuales.
 *
 * El detalle del plan trae solo las rutinas vigentes, y ningún endpoint lista las quitadas: las que se
 * quitan en esta pantalla quedan en «Quitadas del plan» para poder reincorporarlas, y se pierden al salir
 * de ella. Con el plan dado de baja se ven las rutinas, pero no se cambian: el backend lo rechaza.
 */
export function PlanRoutines({
  plan,
  perWeek,
  typedDuration,
}: PlanRoutinesProps) {
  const toast = useToast();
  const grabHintId = useId();
  const assign = useAssignPlanRoutines(plan.id);
  const setActive = useSetPlanRoutinesActive();
  const repeat = useRepeatPlanWeek(plan.id);
  const [reorderError, setReorderError] = useState<string>();
  const reorder = useReorderPlanWeek(plan.id, (error) =>
    setReorderError(planErrorMessage(error)),
  );
  const weeks = useMemo(() => savedWeeks(plan), [plan]);
  const inactive = !plan.active;

  const [folded, setFolded] = useState<ReadonlySet<number>>(new Set());
  const [announcement, setAnnouncement] = useState('');
  const [picker, setPicker] = useState({ open: false, week: 1 });
  const [repeating, setRepeating] = useState({ open: false, week: 1 });
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
  const duration = plan.duration;
  const planned = duration * perWeek;

  function toggleFold(week: number) {
    setFolded((current) => {
      const next = new Set(current);
      if (!next.delete(week)) next.add(week);
      return next;
    });
  }

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

  function move(week: number, from: number, to: number, how: MoveHow) {
    const routines = weeks.find((item) => item.week === week)?.routines ?? [];
    // La semana entera, con el orden nuevo, en un solo pedido.
    const ids = moveItem(
      routines.map(({ key }) => key),
      from,
      to,
    );
    const name = routines[from]?.name;
    if (!ids || !name) return;
    setReorderError(undefined);
    setAnnouncement(`${name}: posición ${to + 1} de ${routines.length}`);
    reorder.mutate(
      { week, ids },
      {
        // Con las flechas no hay aviso, solo el anuncio; arrastrando sí.
        onSuccess: () => {
          if (how === 'drag')
            toast.success(`Orden de la semana ${week} actualizado`);
        },
      },
    );
  }

  function openRepeat(week: number) {
    repeat.reset();
    setRepeating({ open: true, week });
  }

  function repeatWeek(targets: number[]) {
    const from = repeating.week;
    repeat.mutate(
      { fromWeek: from, toWeeks: targets },
      {
        onSuccess: () => {
          toast.success(
            `Semana ${from} repetida en ${targets.length} semana${targets.length === 1 ? '' : 's'}`,
          );
          setRepeating((current) => ({ ...current, open: false }));
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

  function askRemove(key: string) {
    const link = plan.routines.find(({ id }) => id === key);
    if (!link) return;
    setActive.reset();
    setRemoving([link]);
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

  const repeatSource = weeks.find((item) => item.week === repeating.week);

  return (
    <>
      <PlanWeeksSection
        summary={
          planned > 0
            ? `${plan.routine_count} de ${routinesCount(planned)}`
            : routinesCount(plan.routine_count)
        }
        complete={planned > 0 && plan.routine_count === planned}
        intro="Los cambios de esta sección se aplican al instante, sin pasar por “Guardar planificación”."
        notice={
          typedDuration > 0 && typedDuration !== duration
            ? `Cambiaste la duración a ${typedDuration} semana${typedDuration === 1 ? '' : 's'}: las semanas se ajustan cuando guardes la planificación.`
            : undefined
        }
        alert={reorderError}
        announcement={announcement}
        grabHintId={grabHintId}
        footer={
          <>
            {weeks.length === 0 ? (
              <EmptyState
                icon="list"
                message="Este plan no tiene duración fija. Indicá una duración de 1 semana o más y guardala para armar sus semanas."
              />
            ) : selecting ? (
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
                  Quitar
                  {selectedLinks.length > 0 && ` (${selectedLinks.length})`}
                </Button>
              </Columns>
            ) : (
              plan.routines.length > 1 && (
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    disabled={inactive}
                    onClick={() => setSelecting(true)}
                  >
                    Elegir varias para quitar
                  </Button>
                </div>
              )
            )}
            {removed.length > 0 && (
              <section
                aria-label="Quitadas del plan"
                className={styles.removed}
              >
                <SectionHeader
                  level={4}
                  title="Quitadas del plan"
                  aside={removed.length}
                />
                <p className={styles.hint}>
                  Volvés a ponerlas desde acá, a su lugar o a otro. Cuando
                  salgas de esta pantalla ya no las vas a ver: para sumarlas de
                  nuevo vas a tener que agregarlas.
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
          </>
        }
      >
        {weeks.map(({ week, routines }) => (
          <PlanWeekCard
            key={week}
            week={week}
            routines={routines}
            slots={perWeek}
            folded={folded.has(week)}
            onToggleFold={() => toggleFold(week)}
            disabled={inactive}
            canRepeat={weeks.length > 1}
            selecting={selecting}
            selected={selected}
            onToggleSelect={toggle}
            grabHintId={grabHintId}
            onAdd={() => openPicker(week)}
            onRemove={({ key }) => askRemove(key)}
            onMove={(from, to, how) => move(week, from, to, how)}
            onRepeat={() => openRepeat(week)}
          />
        ))}
      </PlanWeeksSection>
      <PlanRoutinePicker
        open={picker.open}
        duration={duration}
        defaultWeek={picker.week}
        submitting={assign.isPending}
        error={assign.isError ? planErrorMessage(assign.error) : undefined}
        onSubmit={add}
        onClose={() => setPicker((current) => ({ ...current, open: false }))}
      />
      <PlanRepeatModal
        open={repeating.open}
        source={{
          week: repeating.week,
          names: repeatSource?.routines.map(({ name }) => name) ?? [],
        }}
        weeks={weeks.map(({ week, routines }) => ({
          week,
          count: routines.length,
        }))}
        submitting={repeat.isPending}
        error={
          repeating.open && repeat.isError
            ? planErrorMessage(repeat.error)
            : undefined
        }
        onSubmit={repeatWeek}
        onClose={() => setRepeating((current) => ({ ...current, open: false }))}
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
