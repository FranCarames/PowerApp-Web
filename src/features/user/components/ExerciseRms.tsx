import type { UserRm } from '@/api/types';
import { formatDate } from '@/shared/lib/dates';
import { formatWeight } from '@/shared/lib/format';
import {
  Button,
  EmptyState,
  ErrorState,
  List,
  ListItem,
  ListSkeleton,
  SectionHeader,
  Tile,
} from '@/shared/ui';

import styles from './ExerciseRms.module.css';

interface ExerciseRmsProps {
  /** Los RMs del ejercicio, del más reciente al más antiguo. `undefined` mientras no llegaron. */
  rms: readonly UserRm[] | undefined;
  /** Mensaje de error si no se pudieron cargar los RMs. */
  error: string | null;
  onRetry: () => void;
  retrying: boolean;
  onRegister: () => void;
}

/**
 * Los RMs del propio alumno para este ejercicio (CU-U-11): peso, repeticiones y fecha, del más reciente
 * al más antiguo, como referencia mientras entrena. Sin ninguno, invita a registrar el primero. Se
 * editan y se borran desde Mis RMs.
 */
export function ExerciseRms({
  rms,
  error,
  onRetry,
  retrying,
  onRegister,
}: ExerciseRmsProps) {
  let content;
  if (error) {
    content = (
      <ErrorState message={error} onRetry={onRetry} retrying={retrying} />
    );
  } else if (!rms) {
    content = <ListSkeleton rows={2} />;
  } else if (rms.length === 0) {
    content = (
      <EmptyState
        icon="trophy"
        title="Todavía no tenés RMs de este ejercicio"
        message="Registrá el primero para tenerlo a mano mientras entrenás."
      />
    );
  } else {
    content = (
      <List>
        {rms.map((rm) => (
          <ListItem
            key={rm.id}
            leading={<Tile icon="trophy" tone="acc" />}
            title={
              <span className={styles.weight}>{formatWeight(rm.weight)}</span>
            }
            subtitle={`${rm.reps} ${rm.reps === 1 ? 'repetición' : 'repeticiones'} · ${formatDate(rm.date)}`}
          />
        ))}
      </List>
    );
  }

  return (
    <section aria-label="Mis RMs de este ejercicio">
      <SectionHeader
        title="Mis RMs"
        aside={
          rms &&
          rms.length > 0 &&
          `${rms.length} ${rms.length === 1 ? 'registrado' : 'registrados'}`
        }
      />
      {content}
      <Button
        variant="sec"
        icon="plus"
        className={styles.register}
        onClick={onRegister}
      >
        Registrar RM
      </Button>
    </section>
  );
}
