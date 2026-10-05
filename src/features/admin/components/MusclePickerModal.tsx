import type { MuscleGroupWithMuscles } from '@/api/pending';
import {
  Button,
  EmptyState,
  List,
  ListItem,
  Modal,
  SectionHeader,
} from '@/shared/ui';

interface MusclePickerModalProps {
  open: boolean;
  /** Los grupos con sus músculos: se ofrecen agrupados. */
  groups: readonly MuscleGroupWithMuscles[];
  /** Los músculos que el ejercicio ya tiene: no se vuelven a ofrecer. */
  selectedIds: readonly string[];
  onPick: (muscleId: string) => void;
  onClose: () => void;
}

/** Elegir un músculo para el ejercicio (CU-A-02): los que faltan, agrupados por grupo muscular. */
export function MusclePickerModal({
  open,
  groups,
  selectedIds,
  onPick,
  onClose,
}: MusclePickerModalProps) {
  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, 'es');
  const available = groups
    .map((group) => ({
      ...group,
      muscles: group.muscles
        .filter(({ id }) => !selectedIds.includes(id))
        .sort(byName),
    }))
    .filter((group) => group.muscles.length > 0)
    .sort(byName);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar músculo"
      actions={
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      }
    >
      {available.length === 0 ? (
        <EmptyState
          icon="grid"
          message={
            groups.length === 0
              ? 'Todavía no hay músculos cargados. Se crean en Catálogo.'
              : 'Ya agregaste todos los músculos.'
          }
        />
      ) : (
        available.map((group) => (
          <section key={group.id}>
            <SectionHeader level={3} title={group.name} />
            <List gap={8}>
              {group.muscles.map((muscle) => (
                <ListItem
                  key={muscle.id}
                  title={muscle.name}
                  onClick={() => onPick(muscle.id)}
                />
              ))}
            </List>
          </section>
        ))
      )}
    </Modal>
  );
}
