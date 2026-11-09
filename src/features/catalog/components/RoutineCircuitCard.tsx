import { useId, useState } from 'react';

import type { CircuitDetail } from '@/api/pending';
import type { CircuitListItemPlus } from '@/api/types';
import { formatSetBlock, setKind } from '@/shared/lib/sets';
import { Card, IconButton, Pill, Switch, Tile } from '@/shared/ui';

import { circuitTypeName } from '../circuitTypes';
import { useCircuit } from '../hooks/useCircuits';
import styles from './RoutineCircuitCard.module.css';

type CircuitExercise = CircuitDetail['exercises'][number];

/** Un ejercicio del circuito para mostrarlo: sus series y su nota, si se conocen (el listado de circuitos no las trae). */
interface ExerciseLine {
  id: string;
  name: string;
  sets?: CircuitExercise['sets'];
  note?: string;
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
  /** La rutina está dada de baja: se ve, pero no se ordena, edita ni quita. «Ver series» sigue andando. */
  disabled?: boolean;
  /** Un lugar arriba (`-1`) o abajo (`1`). */
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * Un circuito dentro de la rutina (CU-E-16, paso 3, y CU-E-17, paso 1): su nombre, «<tipo> · N
 * ejercicios», en cuántas rutinas se usa (si es más de una) y sus ejercicios con la cantidad de series y
 * su tipo, con los botones para subirlo, bajarlo, editarlo y quitarlo. El orden de la lista es el orden
 * de la rutina. «Ver series» muestra, a pedido, cada bloque de series y la nota de cada ejercicio: es
 * estado de la tarjeta (arranca apagado y no se recuerda) y no cambia la rutina.
 */
export function RoutineCircuitCard({
  index,
  count,
  circuitId,
  detail,
  listed,
  routines,
  disabled = false,
  onMove,
  onEdit,
  onRemove,
}: RoutineCircuitCardProps) {
  // Un circuito que se acaba de agregar no está en el detalle de la rutina: se lo pide para tener sus series.
  const fetched = useCircuit(detail ? null : circuitId);
  const circuit = detail ?? fetched.data;
  const [showSets, setShowSets] = useState(false);
  const exercisesId = useId();

  const name = circuit?.name ?? listed?.name ?? 'Circuito';
  const active = circuit?.active ?? listed?.active ?? true;
  const type = circuit ?? listed;
  const exercises: ExerciseLine[] | undefined = circuit
    ? [...circuit.exercises]
        .sort((a, b) => a.exercise_order - b.exercise_order)
        .map(({ id, exercise, sets, coach_note }) => ({
          id,
          name: exercise.name,
          sets: [...sets].sort((a, b) => a.set_order - b.set_order),
          note: coach_note?.trim() || undefined,
        }))
    : listed?.exercises.map(({ id, exercise }) => ({
        id,
        name: exercise.name,
      }));

  const parts = [
    type && circuitTypeName(type),
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
            disabled={disabled || index === 0}
            onClick={() => onMove(-1)}
          />
          <IconButton
            variant="ghost"
            icon="chev"
            className={styles.down}
            label={`Bajar ${name}`}
            disabled={disabled || index === count - 1}
            onClick={() => onMove(1)}
          />
          <IconButton
            variant="ghost"
            icon="edit"
            label={`Editar ${name}`}
            disabled={disabled}
            onClick={onEdit}
          />
          <IconButton
            variant="ghost"
            danger
            icon="x"
            label={`Quitar ${name} de la rutina`}
            disabled={disabled}
            onClick={onRemove}
          />
        </div>
      </div>
      {exercises &&
        (exercises.length === 0 ? (
          <p className={styles.empty}>Este circuito no tiene ejercicios.</p>
        ) : (
          <>
            <div className={styles.seriesRow}>
              {/* El interruptor ya se anuncia con el nombre del circuito: este texto es para la vista. */}
              <span aria-hidden="true">Ver series</span>
              <Switch
                checked={showSets}
                onChange={setShowSets}
                label={`Ver series de ${name}`}
                aria-controls={exercisesId}
              />
            </div>
            <ul id={exercisesId} className={styles.exercises}>
              {exercises.map((exercise) =>
                showSets ? (
                  <ExerciseWithSets key={exercise.id} exercise={exercise} />
                ) : (
                  <ExerciseSummary key={exercise.id} exercise={exercise} />
                ),
              )}
            </ul>
          </>
        ))}
    </Card>
  );
}

/** La píldora del tipo de series de un ejercicio, si se conocen sus series. */
function KindPill({ sets }: { sets: ExerciseLine['sets'] }) {
  if (!sets) return null;
  const kind = kindsLabel(sets);
  return <Pill tone={kind.special ? 'acc' : 'mut'}>{kind.label}</Pill>;
}

/** Con «Ver series» apagado: el nombre, «N series» (la suma de sus bloques) y el tipo. */
function ExerciseSummary({ exercise }: { exercise: ExerciseLine }) {
  const { name, sets } = exercise;
  return (
    <li className={styles.exercise}>
      <span className={styles.exerciseName}>{name}</span>
      {sets && (
        <span className={styles.series}>
          {sets.reduce((total, set) => total + set.set_count, 0)} series
        </span>
      )}
      <KindPill sets={sets} />
    </li>
  );
}

/**
 * Con «Ver series» prendido: el nombre y el tipo, y debajo una línea por bloque (el resumen del
 * encabezado de cada bloque en el editor de circuitos) y la nota del entrenador entre comillas. Si el
 * detalle del circuito todavía no llegó, solo el nombre: las líneas aparecen cuando llega.
 */
function ExerciseWithSets({ exercise }: { exercise: ExerciseLine }) {
  const { name, sets, note } = exercise;
  return (
    <li className={styles.detailed}>
      <div className={styles.exercise}>
        <span className={styles.exerciseName}>{name}</span>
        <KindPill sets={sets} />
      </div>
      {sets && sets.length > 0 && (
        <ul className={styles.blocks}>
          {sets.map((set) => (
            <li key={set.id}>{formatSetBlock(set)}</li>
          ))}
        </ul>
      )}
      {note && <p className={styles.note}>“{note}”</p>}
    </li>
  );
}
