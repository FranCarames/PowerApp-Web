import type { PlanificationAsignation } from '@/api/types';
import { cx } from '@/shared/lib/cx';
import { IconButton, ListItem, Pill, Tile } from '@/shared/ui';

import styles from './PlanRoutineRow.module.css';

interface PlanRoutineRowProps {
  /** La rutina en el plan: su vínculo, con la semana, la posición y la rutina. */
  link: PlanificationAsignation;
  /** Con el plan dado de baja no se puede quitar nada. */
  disabled?: boolean;
  /** Si se están eligiendo rutinas para quitarlas en lote: la fila pasa a ser un interruptor. */
  selecting?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
}

/**
 * Una rutina dentro de una semana del plan (CU-E-12): su nombre, su posición en la semana (una etiqueta
 * que puede repetirse) y su nota. Una rutina dada de baja sigue apareciendo en el plan, con "Rutina
 * inactiva". Con el botón de la derecha se la quita del plan; eligiendo rutinas para quitarlas en
 * lote, la fila entera marca y desmarca.
 */
export function PlanRoutineRow({
  link,
  disabled = false,
  selecting = false,
  selected = false,
  onToggle,
  onRemove,
}: PlanRoutineRowProps) {
  const { routine, order, week } = link;
  const inactivePill = !routine.active && (
    <Pill tone="warn">Rutina inactiva</Pill>
  );
  const common = {
    leading: <Tile icon="list" tone="acc" />,
    title: routine.name,
    subtitle: routine.coach_note
      ? `Posición ${order} · ${routine.coach_note}`
      : `Posición ${order}`,
    className: cx(!routine.active && styles.inactive),
  };

  if (selecting) {
    return (
      <ListItem
        {...common}
        trailing={inactivePill}
        selected={selected}
        onClick={() => onToggle?.()}
      />
    );
  }

  return (
    <ListItem
      {...common}
      trailing={
        <>
          {inactivePill}
          <IconButton
            variant="ghost"
            danger
            icon="x"
            label={`Quitar ${routine.name} de la semana ${week}`}
            disabled={disabled}
            onClick={onRemove}
          />
        </>
      }
    />
  );
}
