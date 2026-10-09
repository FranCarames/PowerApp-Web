import { Button, Chip, ChipGroup, PageHeader } from '@/shared/ui';

import { RestTimerDial } from '../components/RestTimerDial';
import { useRestTimer } from '../hooks/useRestTimer';
import { REST_PRESETS } from '../restTimerStore';
import styles from './TimerPage.module.css';

/** El texto de cada duración en el chip y el que lee un lector de pantalla. */
function describePreset(seconds: number) {
  if (seconds < 120)
    return { label: `${seconds}s`, spoken: `${seconds} segundos` };
  const minutes = seconds / 60;
  return { label: `${minutes}:00`, spoken: `${minutes} minutos` };
}

/** Lo que dice y hace el botón principal en cada estado. */
const TOGGLE = {
  idle: { label: 'Iniciar', icon: 'play' },
  running: { label: 'Pausar', icon: 'pause' },
  paused: { label: 'Reanudar', icon: 'play' },
  done: { label: 'Repetir', icon: 'play' },
} as const;

/**
 * Temporizador de descanso entre series (CU-U-14): una cuenta regresiva en el cliente, con las
 * duraciones de siempre, iniciar, pausar y reiniciar. El estado vive fuera de la pantalla
 * (`restTimerStore`), así que sigue corriendo si el alumno se va a otra; al llegar a cero avisa con un
 * toast y vibra (`RestTimerWatcher`). No guarda nada.
 */
export function TimerPage() {
  const timer = useRestTimer();
  const toggle = TOGGLE[timer.status];

  return (
    <>
      <PageHeader eyebrow="Descanso entre series" title="Temporizador" />
      <RestTimerDial
        left={timer.left}
        total={timer.total}
        status={timer.status}
      />
      <ChipGroup center aria-label="Duración del descanso">
        {REST_PRESETS.map((seconds) => {
          const { label, spoken } = describePreset(seconds);
          return (
            <Chip
              key={seconds}
              selected={timer.total === seconds}
              aria-label={spoken}
              onClick={() => timer.select(seconds)}
            >
              {label}
            </Chip>
          );
        })}
      </ChipGroup>
      <div className={styles.actions}>
        <Button variant="ghost" icon="refresh" onClick={timer.reset}>
          Reiniciar
        </Button>
        <Button icon={toggle.icon} onClick={timer.toggle}>
          {toggle.label}
        </Button>
      </div>
    </>
  );
}
