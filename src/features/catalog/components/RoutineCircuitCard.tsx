import type { CircuitDetail } from '@/api/pending';
import type { CircuitListItemPlus } from '@/api/types';
import { setKind } from '@/shared/lib/sets';
import { Card, IconButton, Pill, Tile } from '@/shared/ui';

import { useCircuit } from '../hooks/useCircuits';
import styles from './RoutineCircuitCard.module.css';

/** Un ejercicio del circuito para mostrarlo: sus series, si se conocen (el listado de circuitos no las trae). */
interface ExerciseLine {
  id: string;
  name: string;
  sets?: CircuitDetail['exercises'][number]['sets'];
}

/** El tipo de las series de un ejercicio: "Normal" o, si alguna lo es, "AMRAP", "RM" o "AMRAP + RM". */
function kindsLabel(sets: NonNullable<ExerciseLine['sets']>): {
  label: string;
  special: boolean;
} {
  const special = [...new Set(sets.map(setKind))].filter(
    (kind) => kind !== 'normal',
  );
  return special.length === 0
    ? { label: 'Normal', special: false }
    : {
        label: special.map((kind) => kind.toUpperCase()).join(' + '),
        special: true,
      };
}

interface RoutineCircuitCardProps {
  /** Su lugar en la rutina, de 0 a `count - 1`. */
  index: number;
  count: number;
  circuitId: string;
  /** El circuito completo, si la rutina ya lo traía. Sin él se lo pide, con sus series. */
  detail?: CircuitDetail;
  /** Su ficha del listado de circuitos (nombre, tipo y ejercicios, sin series): lo que se muestra mientras llega el detalle. */
  listed?: CircuitListItemPlus;
  /** En cuántas rutinas se usa contando esta, si ya se sabe. */
  routines?: number;
  /** Un lugar arriba (`-1`) o abajo (`1`). */
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * Un circuito dentro de la rutina (CU-E-16 y CU-E-17): su nombre, cuántos ejercicios tiene, en cuántas
 * rutinas se usa (si es más de una) y sus ejercicios con la cantidad de series y su tipo, con los botones para subirlo,
 * bajarlo, editarlo y quitarlo. El orden de la lista es el orden de la rutina.
 */
export function RoutineCircuitCard({
  index,
  count,
  circuitId,
  detail,
  listed,
  routines,
  onMove,
  onEdit,
  onRemove,
}: RoutineCircuitCardProps) {
  // Un circuito que se acaba de agregar no está en el detalle de la rutina: se lo pide para tener sus series.
  const fetched = useCircuit(detail ? null : circuitId);
  const circuit = detail ?? fetched.data;

  const name = circuit?.name ?? listed?.name ?? 'Circuito';
  const active = circuit?.active ?? listed?.active ?? true;
  const exercises: ExerciseLine[] | undefined = circuit
    ? [...circuit.exercises]
        .sort((a, b) => a.exercise_order - b.exercise_order)
        .map(({ id, exercise, sets }) => ({ id, name: exercise.name, sets }))
    : listed?.exercises.map(({ id, exercise }) => ({
        id,
        name: exercise.name,
      }));

  const parts = [
    exercises &&
      `${exercises.length} ejercicio${exercises.length === 1 ? '' : 's'}`,
    routines !== undefined && routines > 1 && `se usa en ${routines} rutinas`,
  ].filter((part) => part);

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <Tile icon="cycle" tone="acc" />
        <div className={styles.text}>
          <div className={styles.name}>{name}</div>
          <div className={styles.sub}>
            {parts.length > 0 ? parts.join(' · ') : 'Cargando…'}
          </div>
        </div>
        {!active && <Pill tone="warn">Dado de baja</Pill>}
        <div className={styles.actions}>
          <IconButton
            variant="ghost"
            icon="chev"
            className={styles.up}
            label={`Subir ${name}`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          />
          <IconButton
            variant="ghost"
            icon="chev"
            className={styles.down}
            label={`Bajar ${name}`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          />
          <IconButton
            variant="ghost"
            icon="edit"
            label={`Editar ${name}`}
            onClick={onEdit}
          />
          <IconButton
            variant="ghost"
            danger
            icon="x"
            label={`Quitar ${name} de la rutina`}
            onClick={onRemove}
          />
        </div>
      </div>
      {exercises &&
        (exercises.length === 0 ? (
          <p className={styles.empty}>Este circuito no tiene ejercicios.</p>
        ) : (
          <ul className={styles.exercises}>
            {exercises.map(({ id, name: exerciseName, sets }) => {
              const kind = sets && kindsLabel(sets);
              return (
                <li key={id} className={styles.exercise}>
                  <span className={styles.exerciseName}>{exerciseName}</span>
                  {sets && kind && (
                    <>
                      <span className={styles.series}>
                        {sets.reduce((total, set) => total + set.set_count, 0)}{' '}
                        series
                      </span>
                      <Pill tone={kind.special ? 'acc' : 'mut'}>
                        {kind.label}
                      </Pill>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ))}
    </Card>
  );
}
