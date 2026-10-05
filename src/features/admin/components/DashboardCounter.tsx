import { useNavigate } from 'react-router';

import type { IconName } from '@/shared/icons';
import { Card, Skeleton, Tile, type Tone } from '@/shared/ui';

import styles from './DashboardCounter.module.css';

interface DashboardCounterProps {
  /** A dónde lleva la tarjeta: la sección que cuenta. */
  to: string;
  icon: IconName;
  tone: Tone;
  label: string;
  /** El número. `undefined` si todavía no llegó o no se pudo cargar. */
  value: number | undefined;
  pending: boolean;
}

/** Una tarjeta del panel: cuántos hay de algo y un acceso a su sección. Si no carga, muestra "–". */
export function DashboardCounter({
  to,
  icon,
  tone,
  label,
  value,
  pending,
}: DashboardCounterProps) {
  const navigate = useNavigate();

  return (
    <Card onClick={() => navigate(to)} className={styles.counter}>
      <Tile icon={icon} tone={tone} className={styles.tile} />
      <span className={styles.value}>
        {pending ? (
          <Skeleton width={36} height={28} radius={6} />
        ) : (
          (value ?? '–')
        )}
      </span>
      <span className={styles.label}>{label}</span>
    </Card>
  );
}
