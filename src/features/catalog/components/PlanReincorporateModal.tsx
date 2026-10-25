import { useState } from 'react';

import type { PlanificationAsignation } from '@/api/types';
import {
  Button,
  Field,
  Input,
  Modal,
  Note,
  NumberStepper,
  Segmented,
} from '@/shared/ui';

import { parseOrder, parseWeek, weekLimit } from '../planRoutines';
import styles from './PlanReincorporateModal.module.css';

/** A dónde vuelve la rutina: sin nada, a su lugar; con la semana, al final de ella; con la posición, tal cual. */
export interface PlanPlace {
  week?: number;
  order?: number;
}

interface PlanReincorporateModalProps {
  open: boolean;
  /** La rutina que vuelve, tal como estaba en el plan: su semana y su posición de antes. */
  routine: PlanificationAsignation | null;
  /** La duración actual del plan en semanas (0 es sin duración fija). */
  duration: number;
  /** Mientras se reincorpora: el botón queda ocupado y el modal no se cierra. */
  submitting: boolean;
  /** Por qué falló el último intento, ya en español. */
  error?: string;
  onSubmit: (place: PlanPlace) => void;
  onClose: () => void;
}

/**
 * Reincorporar una rutina quitada del plan (CU-E-12c): vuelve a su lugar de antes (su semana y su
 * posición) o a otro que se elige: una semana, y de forma opcional la posición dentro de ella (sin
 * posición, va al final de la semana). Si la duración del plan se achicó y su semana ya no existe, no
 * puede volver a su lugar y hay que elegir una semana válida.
 */
export function PlanReincorporateModal({
  open,
  routine,
  onClose,
  submitting,
  ...body
}: PlanReincorporateModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      blocking={submitting}
      title="Reincorporar rutina"
      description={routine && <b>{routine.routine.name}</b>}
    >
      {/* El contenido solo existe con el modal abierto: el lugar elegido arranca de cero cada vez. */}
      {open && routine && (
        <ReincorporateBody
          routine={routine}
          onClose={onClose}
          submitting={submitting}
          {...body}
        />
      )}
    </Modal>
  );
}

function ReincorporateBody({
  routine,
  duration,
  submitting,
  error,
  onSubmit,
  onClose,
}: Omit<PlanReincorporateModalProps, 'open' | 'routine'> & {
  routine: PlanificationAsignation;
}) {
  // Con su semana fuera de la duración actual no puede volver a su lugar.
  const lost = duration > 0 && routine.week > duration;
  const [mode, setMode] = useState<'back' | 'choose'>(lost ? 'choose' : 'back');
  const [week, setWeek] = useState(String(lost ? duration : routine.week));
  const [order, setOrder] = useState('');
  const [problems, setProblems] = useState<{ week?: string; order?: string }>(
    {},
  );

  function submit() {
    if (mode === 'back') {
      onSubmit({});
      return;
    }
    const parsedWeek = parseWeek(week, duration);
    const parsedOrder = parseOrder(order);
    setProblems({
      week: 'error' in parsedWeek ? parsedWeek.error : undefined,
      order: 'error' in parsedOrder ? parsedOrder.error : undefined,
    });
    if ('error' in parsedWeek || 'error' in parsedOrder) return;
    onSubmit({ week: parsedWeek.week, order: parsedOrder.order });
  }

  return (
    <>
      {error && (
        <Note tone="err" icon="alert" role="alert">
          {error}
        </Note>
      )}
      {lost ? (
        <Note tone="warn" icon="alert">
          Estaba en la semana {routine.week}, pero el plan ahora dura {duration}{' '}
          semana{duration === 1 ? '' : 's'}. Elegí en qué semana vuelve.
        </Note>
      ) : (
        <Segmented
          label="A dónde vuelve"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'back', label: 'A su lugar' },
            { value: 'choose', label: 'Elegir lugar' },
          ]}
          className={styles.segmented}
        />
      )}
      {mode === 'back' ? (
        <p className={styles.place}>
          Vuelve a la semana {routine.week}, en la posición {routine.order}.
        </p>
      ) : (
        <>
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
        </>
      )}
      <div className={styles.actions}>
        <Button loading={submitting} onClick={submit}>
          Reincorporar
        </Button>
        <Button variant="ghost" disabled={submitting} onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </>
  );
}
