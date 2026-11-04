import type { ReactNode } from 'react';

import { Card } from '@/shared/ui';

import styles from './HistoryChartCard.module.css';

interface HistoryChartCardProps {
  /** El `id` del título: la tarjeta es una región con ese nombre. */
  titleId: string;
  title: string;
  subtitle: ReactNode;
  /** A la derecha del título: las flechas del mes o la píldora de la diferencia. */
  aside?: ReactNode;
  /** El título y el subtítulo se anuncian al cambiar (el cambio de mes, spec 11). */
  live?: boolean;
  /** El título del calendario es un poco más grande (16 px). */
  large?: boolean;
  children: ReactNode;
}

/** Una tarjeta del historial con título, subtítulo y algo a la derecha (`.hhead` del prototipo). */
export function HistoryChartCard({
  titleId,
  title,
  subtitle,
  aside,
  live = false,
  large = false,
  children,
}: HistoryChartCardProps) {
  return (
    <Card>
      <section aria-labelledby={titleId}>
        <div className={styles.head}>
          <div
            aria-live={live ? 'polite' : undefined}
            className={styles.titles}
          >
            <h2 id={titleId} className={large ? styles.large : styles.title}>
              {title}
            </h2>
            <div className={styles.subtitle}>{subtitle}</div>
          </div>
          {aside}
        </div>
        {children}
      </section>
    </Card>
  );
}
