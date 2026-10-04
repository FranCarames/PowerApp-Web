import { Card } from './Card';
import { List } from './List';
import styles from './ListSkeleton.module.css';
import { Skeleton } from './Skeleton';
import { VisuallyHidden } from './VisuallyHidden';

interface ListSkeletonProps {
  rows?: number;
  columns?: 1 | 2;
}

/** Estado de carga de una lista: filas con la forma de un <ListItem>. */
export function ListSkeleton({ rows = 4, columns = 1 }: ListSkeletonProps) {
  return (
    <List columns={columns} aria-busy="true">
      <VisuallyHidden role="status">Cargando…</VisuallyHidden>
      {Array.from({ length: rows }, (_, index) => (
        <Card key={index} row>
          <Skeleton circle height={40} />
          <div className={styles.lines}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton width={56} height={20} radius={999} />
        </Card>
      ))}
    </List>
  );
}
