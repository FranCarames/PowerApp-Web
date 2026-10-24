import type { PlanificationListItem } from '@/api/types';
import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';
import { formatWeeks } from '@/shared/lib/format';
import { capitalize } from '@/shared/lib/text';
import { Card, Pill } from '@/shared/ui';

import styles from './PlanCard.module.css';

interface PlanCardProps {
  plan: PlanificationListItem;
  onOpen: (plan: PlanificationListItem) => void;
}

/** "2 de 3 rutinas": las asignadas al plan sobre las que declaró el entrenador. */
function routinesLabel(assigned: number, goal: number): string {
  return `${assigned} de ${goal} rutina${goal === 1 ? '' : 's'}`;
}

/**
 * Una planificación sistémica (CU-E-08): su nombre, su duración en semanas y su tipo, su descripción y
 * cuántas rutinas tiene asignadas de las que declaró el entrenador (verde si ya están todas). Si está
 * dada de baja, se ve apagada con "Inactiva". Tocarla abre su editor, donde también se la da de baja o
 * se la reactiva.
 */
export function PlanCard({ plan, onOpen }: PlanCardProps) {
  const {
    name,
    description,
    type,
    duration,
    number_of_routines,
    routine_count,
  } = plan;

  return (
    <Card
      className={cx(styles.card, !plan.active && styles.inactive)}
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
      {description && <span className={styles.description}>{description}</span>}
      <span className={styles.foot}>
        <Pill
          tone={routine_count === number_of_routines ? 'ok' : 'acc'}
          title={`${routine_count} rutinas asignadas de ${number_of_routines} previstas`}
        >
          {routinesLabel(routine_count, number_of_routines)}
        </Pill>
      </span>
    </Card>
  );
}
