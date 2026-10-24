import type { PlanificationListItem } from '@/api/types';
import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';
import { formatWeeks } from '@/shared/lib/format';
import { capitalize } from '@/shared/lib/text';
import { Button, Card, Pill } from '@/shared/ui';

import styles from './PlanCard.module.css';

interface PlanCardProps {
  plan: PlanificationListItem;
  onOpen: (plan: PlanificationListItem) => void;
  /**
   * Asignar la planificación a alumnos (CU-E-13). Solo la hace el Entrenador (al Admin el backend le
   * responde 403): sin esto no hay botón. Una planificación dada de baja tampoco lo muestra, porque no
   * se ofrece para asignaciones nuevas.
   */
  onAssign?: (plan: PlanificationListItem) => void;
}

/** "2 de 3 rutinas": las asignadas al plan sobre las que declaró el entrenador. */
function routinesLabel(assigned: number, goal: number): string {
  return `${assigned} de ${goal} rutina${goal === 1 ? '' : 's'}`;
}

/**
 * Una planificación sistémica (CU-E-08): su nombre, su duración en semanas y su tipo, su descripción y
 * cuántas rutinas tiene asignadas de las que declaró el entrenador (verde si ya están todas). Si está
 * dada de baja, se ve apagada con "Inactiva". Tocarla abre su editor, donde también se la da de baja o
 * se la reactiva. El Entrenador suma el botón "Asignar".
 *
 * La tarjeta no es un botón entero porque "Asignar" no puede ir dentro de otro botón: el que abre el
 * editor ocupa el contenido y se estira (`::after`) sobre toda la tarjeta, y "Asignar" queda encima.
 */
export function PlanCard({ plan, onOpen, onAssign }: PlanCardProps) {
  const {
    name,
    description,
    type,
    duration,
    number_of_routines,
    routine_count,
  } = plan;

  return (
    <Card className={cx(styles.card, !plan.active && styles.inactive)}>
      <button
        type="button"
        className={styles.open}
        onClick={() => onOpen(plan)}
      >
        <span className={styles.head}>
          <span className={cx(styles.name, !name && styles.unnamed)}>
            {name || 'Sin nombre'}
          </span>
          {!plan.active && <Pill tone="warn">Inactiva</Pill>}
          <Icon name="chev" size={18} className={styles.chevron} />
        </span>
        <span className={styles.sub}>
          {formatWeeks(duration)}
          {type && ` · ${capitalize(type)}`}
        </span>
        {description && (
          <span className={styles.description}>{description}</span>
        )}
      </button>
      <div className={styles.foot}>
        {/* Queda sobre el área estirada para que se vea su `title`; tocarla abre el editor igual que la tarjeta. */}
        <Pill
          tone={routine_count === number_of_routines ? 'ok' : 'acc'}
          className={styles.routines}
          title={`${routine_count} rutinas asignadas de ${number_of_routines} previstas`}
          onClick={() => onOpen(plan)}
        >
          {routinesLabel(routine_count, number_of_routines)}
        </Pill>
        {onAssign && plan.active && (
          <Button
            sm
            variant="sec"
            className={styles.assign}
            aria-label={`Asignar ${name || 'planificación sin nombre'} a alumnos`}
            onClick={() => onAssign(plan)}
          >
            Asignar
          </Button>
        )}
      </div>
    </Card>
  );
}
