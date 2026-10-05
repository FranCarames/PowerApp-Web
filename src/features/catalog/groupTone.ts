import type { Tone } from '@/shared/ui';

const GROUP_TONES: readonly Tone[] = ['pri', 'acc', 'ok', 'warn'];

/**
 * El color de acento de un grupo muscular. El prototipo asigna uno fijo a cada grupo por su nombre,
 * pero los grupos salen del backend: se elige por el id, así que un grupo conserva su color aunque se
 * sumen o se quiten otros.
 */
export function groupTone(groupId: string): Tone {
  let hash = 0;
  for (const char of groupId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return GROUP_TONES[hash % GROUP_TONES.length];
}
