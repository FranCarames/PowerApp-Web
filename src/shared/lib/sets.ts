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
    set.weight ? formatWeight(set.weight) : null,
    set.rpe ? `RPE ${set.rpe}` : null,
    // El RIR puede ser 0 ("al fallo"): no se descarta por ser falsy.
    set.rir !== undefined && set.rir !== null ? `RIR ${set.rir}` : null,
    set.rm_perc ? `${set.rm_perc}% RM` : null,
    set.rm ? 'RM' : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}
