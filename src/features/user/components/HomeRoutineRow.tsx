import type { RoutineAssignedProgress } from '@/api/types';
import { formatWeekdayDate } from '@/shared/lib/dates';
import { ListItem, Pill, Tile } from '@/shared/ui';

import { isDone, progressText } from '../homeWeek';
import styles from './HomeRoutineRow.module.css';

type HomeRoutineRowProps = {
  name: string;
  progress: RoutineAssignedProgress;
  /** La rutina se dio de baja después de asignarla: el alumno la puede ejecutar igual. */
  inactive: boolean;
  onOpen: () => void;
} & (
  | {
      /** Una rutina de una semana del plan: va por orden, sin día. */
      kind: 'plan';
      letter: string;
      /** El entrenador la quitó del plan: se ve solo lo que el alumno hizo. */
      removed: boolean;
    }
  | {
      /** Una rutina que el entrenador asignó para un día. */
      kind: 'individual';
      date: string;
      today: boolean;
    }
);

/** Los ejercicios hechos de una rutina quitada del plan: es lo único que se ve de ella. */
function removedText({ total }: RoutineAssignedProgress): string {
  if (total === 0) return 'Quitada del plan';
  return `Quitada del plan · ${total} ${total === 1 ? 'ejercicio hecho' : 'ejercicios hechos'}`;
}

/** Una rutina del home: su letra o su día, su nombre, cuánto hizo el alumno y si está hecha. Abre su detalle. */
export function HomeRoutineRow(props: HomeRoutineRowProps) {
  const { name, progress, inactive, onOpen } = props;
  const done = isDone(progress);
  const removed = props.kind === 'plan' && props.removed;
  const today = props.kind === 'individual' && props.today;

  const subtitle = [
    props.kind === 'individual' ? formatWeekdayDate(props.date) : null,
    removed ? removedText(progress) : progressText(progress),
    inactive ? 'Dada de baja' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  let pill;
  if (removed) pill = <Pill tone="warn">Quitada</Pill>;
  else if (done) pill = <Pill tone="ok">Hecha</Pill>;
  else if (today) pill = <Pill tone="pri">Hoy</Pill>;

  return (
    <ListItem
      className={done || removed ? styles.dim : undefined}
      leading={
        props.kind === 'plan' ? (
          <Tile>{props.letter}</Tile>
        ) : (
          <Tile icon="calendar" tone={today && !done ? 'pri' : 'mut'} />
        )
      }
      title={<span className={styles.name}>{name}</span>}
      subtitle={subtitle}
      trailing={pill}
      chevron
      onClick={onOpen}
    />
  );
}
