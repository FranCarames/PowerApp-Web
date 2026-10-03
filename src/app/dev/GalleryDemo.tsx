import type { ReactNode } from 'react';

import { cx } from '@/shared/lib/cx';

import styles from './GalleryDemo.module.css';

interface GalleryDemoProps {
  label: string;
  /** row: en línea · stack: apilados a ancho de columna · grid: columnas que se acomodan solas. */
  layout?: 'row' | 'stack' | 'grid';
  children: ReactNode;
}

export function GalleryDemo({
  label,
  layout = 'row',
  children,
}: GalleryDemoProps) {
  return (
    <div>
      <h3 className={styles.label}>{label}</h3>
      <div className={cx(styles.content, styles[layout])}>{children}</div>
    </div>
  );
}
