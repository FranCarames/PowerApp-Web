import { useId, useState } from 'react';

import { useToast } from '@/shared/ui';

import type { PlanDraftWeeks as Draft } from '../hooks/usePlanDraftWeeks';
import { draftTotal, routinesCount, type WeekRoutine } from '../planRoutines';
import { PLAN_WEEK_ROUTINES_MAX } from '../planSchema';
import { PlanRepeatModal } from './PlanRepeatModal';
import { PlanRoutinePicker, type PlanRoutinePick } from './PlanRoutinePicker';
import { PlanWeekCard } from './PlanWeekCard';
import { PlanWeeksSection } from './PlanWeeksSection';

interface PlanDraftWeeksProps {
  /** Lo que se está armando: vive en el formulario, que lo manda junto con la cabecera al crear. */
  draft: Draft;
  /** Las rutinas por semana que se escribieron: cuántos huecos tiene cada semana (0 si no hay un número válido). */
  perWeek: number;
}

/** El mensaje de que una semana ya llegó al tope. */
const WEEK_FULL = `Una semana admite hasta ${PLAN_WEEK_ROUTINES_MAX} rutinas.`;

/**
 * Las semanas del alta de una planificación (CU-E-09): las semanas 1 a la duración, cada una con tantos
 * huecos como rutinas por semana, que se rearman en el momento al cambiar cualquiera de los dos campos. Se
 * pueden llenar antes de crear: elegir, quitar, ordenar y repetir **no mandan nada** al backend, solo cambian
 * el borrador, que «Crear planificación» guarda junto con la cabecera, todo o nada. Quitar una rutina acá no
 * pide confirmación: todavía no existe ningún vínculo que proteger.
 */
export function PlanDraftWeeks({ draft, perWeek }: PlanDraftWeeksProps) {
  const toast = useToast();
  const grabHintId = useId();
  const [folded, setFolded] = useState<ReadonlySet<number>>(new Set());
  const [announcement, setAnnouncement] = useState('');
  const [picker, setPicker] = useState({ open: false, week: 1 });
  const [repeating, setRepeating] = useState<{
    open: boolean;
    week: number;
    error?: string;
  }>({ open: false, week: 1 });

  const { weeks } = draft;
  const total = draftTotal(weeks);
  const planned = weeks.length * perWeek;
  const weekItems = (week: number) => weeks[week - 1] ?? [];

  function toggleFold(week: number) {
    setFolded((current) => {
      const next = new Set(current);
      if (!next.delete(week)) next.add(week);
      return next;
    });
  }

  function openPicker(week: number) {
    if (weekItems(week).length >= PLAN_WEEK_ROUTINES_MAX) {
      toast.error(WEEK_FULL);
      return;
    }
    setPicker({ open: true, week });
  }

  function add({ week, routines }: PlanRoutinePick) {
    draft.add(week, routines);
    setPicker((current) => ({ ...current, open: false }));
  }

  function move(week: number, from: number, to: number) {
    const name = weekItems(week)[from]?.name;
    draft.move(week, from, to);
    if (name) {
      setAnnouncement(
        `${name}: posición ${to + 1} de ${weekItems(week).length}`,
      );
    }
  }

  function repeat(targets: number[]) {
    const from = repeating.week;
    const sourceCount = weekItems(from).length;
    // Cada semana destino recibe las rutinas de la de origen al final: ninguna puede pasar del tope.
    if (
      targets.some(
        (week) => weekItems(week).length + sourceCount > PLAN_WEEK_ROUTINES_MAX,
      )
    ) {
      setRepeating((current) => ({ ...current, error: WEEK_FULL }));
      return;
    }
    draft.repeat(from, targets);
    toast.success(
      `Semana ${from} repetida en ${targets.length} semana${targets.length === 1 ? '' : 's'}`,
    );
    setRepeating((current) => ({ ...current, open: false, error: undefined }));
  }

  return (
    <PlanWeeksSection
      summary={
        perWeek > 0
          ? `${total} de ${routinesCount(planned)}`
          : routinesCount(total)
      }
      complete={perWeek > 0 && total === planned}
      intro="Se arman solas con la duración y las rutinas por semana. Podés llenarlas ahora o después: lo que elijas acá se guarda al crear la planificación."
      announcement={announcement}
      grabHintId={grabHintId}
    >
      {weeks.map((items, index) => {
        const week = index + 1;
        const routines: WeekRoutine[] = items.map(
          ({ key, name }, position) => ({
            key,
            name,
            position: position + 1,
            inactive: false,
          }),
        );
        return (
          <PlanWeekCard
            key={week}
            week={week}
            routines={routines}
            slots={perWeek}
            folded={folded.has(week)}
            onToggleFold={() => toggleFold(week)}
            canRepeat={weeks.length > 1}
            grabHintId={grabHintId}
            onAdd={() => openPicker(week)}
            onRemove={({ key }) => draft.remove(week, key)}
            onMove={(from, to) => move(week, from, to)}
            onRepeat={() => setRepeating({ open: true, week })}
          />
        );
      })}
      <PlanRoutinePicker
        draft
        open={picker.open}
        duration={weeks.length}
        defaultWeek={picker.week}
        capacity={PLAN_WEEK_ROUTINES_MAX - weekItems(picker.week).length}
        submitting={false}
        onSubmit={add}
        onClose={() => setPicker((current) => ({ ...current, open: false }))}
      />
      <PlanRepeatModal
        open={repeating.open}
        source={{
          week: repeating.week,
          names: weekItems(repeating.week).map(({ name }) => name),
        }}
        weeks={weeks.map((items, index) => ({
          week: index + 1,
          count: items.length,
        }))}
        submitting={false}
        error={repeating.error}
        onSubmit={repeat}
        onClose={() =>
          setRepeating((current) => ({
            ...current,
            open: false,
            error: undefined,
          }))
        }
      />
    </PlanWeeksSection>
  );
}
