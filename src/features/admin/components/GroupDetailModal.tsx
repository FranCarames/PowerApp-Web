import type { MuscleGroupWithMuscles } from '@/api/pending';
import { Button, Card, EmptyState, List, Modal } from '@/shared/ui';

import styles from './GroupDetailModal.module.css';

interface GroupDetailModalProps {
  /** El grupo a mostrar. Con `null` el modal está cerrado. */
  group: MuscleGroupWithMuscles | null;
  onClose: () => void;
}

/** Los músculos de un grupo muscular (CU-A-12), en un modal. */
export function GroupDetailModal({ group, onClose }: GroupDetailModalProps) {
  const muscles = [...(group?.muscles ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'es'),
  );

  return (
    <Modal
      open={group !== null}
      onClose={onClose}
      title={group?.name ?? ''}
      description={
        group &&
        `${muscles.length} músculo${muscles.length === 1 ? '' : 's'} en este grupo`
      }
      actions={
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {muscles.length === 0 ? (
        <EmptyState message="Este grupo todavía no tiene músculos." />
      ) : (
        <List gap={8}>
          {muscles.map((muscle) => (
            <Card key={muscle.id} className={styles.muscle}>
              {muscle.name}
            </Card>
          ))}
        </List>
      )}
    </Modal>
  );
}
