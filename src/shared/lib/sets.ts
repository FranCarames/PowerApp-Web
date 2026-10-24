import { formatWeight } from './format';

/** Los campos de un bloque de series que entran en su resumen, con los nombres del contrato. */
export interface SetBlockSummaryInput {
  set_count: number;
  rep_count: number;
  weight?: number | null;
  rpe?: number | null;
  rir?: number | null;
  rm_perc?: number | null;
  amrap: boolean;
  amrap_time?: number | null;
  rm: boolean;
}

/** La carga de una serie: peso, RPE o RIR, y porcentaje del RM. Lo que no tiene, no entra. */
function loadParts(set: SetBlockSummaryInput): Array<string | null> {
  return [
    set.weight ? formatWeight(set.weight) : null,
    set.rpe ? `RPE ${set.rpe}` : null,
    // El RIR puede ser 0 ("al fallo"): no se descarta por ser falsy.
    set.rir !== undefined && set.rir !== null ? `RIR ${set.rir}` : null,
    set.rm_perc ? `${set.rm_perc}% RM` : null,
  ];
}

/**
 * Un bloque de series en una línea. Una fila del backend es un bloque de series iguales: `set_count: 3`
 * con `rep_count: 8` es "3×8". Con AMRAP, `rep_count` son las repeticiones objetivo ("3×8+") y el valor 1
 * significa "sin objetivo" ("3×AMRAP").
 *
 * @example
 * formatSetBlock({ set_count: 3, rep_count: 8, weight: 80, rpe: 7, amrap: false, rm: false });
 * // "3×8 · 80 kg · RPE 7"
 */
export function formatSetBlock(set: SetBlockSummaryInput): string {
  const reps = set.amrap
    ? set.rep_count > 1
      ? `${set.rep_count}+`
      : 'AMRAP'
    : String(set.rep_count);

  return [
    `${set.set_count}×${reps}`,
    set.amrap && set.amrap_time ? `${set.amrap_time} s` : null,
    ...loadParts(set),
    set.rm ? 'RM' : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/** El tipo de una serie: la normal, la AMRAP (tantas repeticiones como se pueda) o la de RM. */
export type SetKind = 'normal' | 'amrap' | 'rm';

/** El tipo de una serie. Una serie de RM es de RM aunque también traiga AMRAP. */
export function setKind(
  set: Pick<SetBlockSummaryInput, 'amrap' | 'rm'>,
): SetKind {
  if (set.rm) return 'rm';
  return set.amrap ? 'amrap' : 'normal';
}

/** "Normal", "AMRAP · 40s" (con el tiempo, si lo tiene) o "RM": el tipo de la serie para mostrarlo. */
export function formatSetKind(
  set: Pick<SetBlockSummaryInput, 'amrap' | 'amrap_time' | 'rm'>,
): string {
  switch (setKind(set)) {
    case 'rm':
      return 'RM';
    case 'amrap':
      return set.amrap_time ? `AMRAP · ${set.amrap_time}s` : 'AMRAP';
    case 'normal':
      return 'Normal';
  }
}

/**
 * Lo que se pide en una sola serie del bloque: las repeticiones y la carga. Con AMRAP, las
 * repeticiones objetivo van con un "+" ("8+ reps") y el valor 1 significa "sin objetivo".
 *
 * @example
 * formatSetTarget({ set_count: 3, rep_count: 8, weight: 80, rpe: 7, amrap: false, rm: false });
 * // "8 reps · 80 kg · RPE 7"
 */
export function formatSetTarget(set: SetBlockSummaryInput): string {
  let reps: string;
  if (set.amrap) {
    reps = set.rep_count > 1 ? `${set.rep_count}+ reps` : 'Máximas reps';
  } else {
    reps = `${set.rep_count} ${set.rep_count === 1 ? 'rep' : 'reps'}`;
  }

  return [reps, ...loadParts(set)]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/**
 * Despliega los bloques de series en una serie por fila, en orden: un bloque `set_count: 3` son tres
 * series. Cada fila lleva su número (desde 1, contando todo el ejercicio) y el bloque del que sale.
 */
export function expandSetBlocks<
  T extends { set_order: number; set_count: number },
>(blocks: readonly T[]): Array<{ number: number; block: T }> {
  const rows: Array<{ number: number; block: T }> = [];
  for (const block of [...blocks].sort((a, b) => a.set_order - b.set_order)) {
    for (let index = 0; index < block.set_count; index += 1) {
      rows.push({ number: rows.length + 1, block });
    }
  }
  return rows;
}
