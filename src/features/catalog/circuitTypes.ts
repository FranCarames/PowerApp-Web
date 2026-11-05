import { isApiError } from '@/api/errors';
import type { CircuitType, CircuitTypeRef } from '@/api/types';

// Los tipos de circuito (BE-44): lo que comparten las pantallas que los muestran. El tipo es un catálogo
// del Admin (CU-A-24 a CU-A-27); cada circuito trae el suyo en `circuit_type`.

/**
 * El nombre del tipo de un circuito, tal como lo escribió el Admin (sin `capitalize`): el de la tarjeta,
 * el del selector de circuitos de la rutina y el que ve el alumno. Un tipo dado de baja no se marca:
 * eso solo pasa en el selector del editor.
 */
export function circuitTypeName(circuit: {
  circuit_type: Pick<CircuitTypeRef, 'type'>;
}): string {
  return circuit.circuit_type.type;
}

/** "<tipo> · N ejercicios": la línea de un circuito en su tarjeta y en el selector de la rutina (CU-E-21). */
export function circuitSubtitle(circuit: {
  circuit_type: Pick<CircuitTypeRef, 'type'>;
  exercise_count: number;
}): string {
  const count = circuit.exercise_count;
  return `${circuitTypeName(circuit)} · ${count} ejercicio${count === 1 ? '' : 's'}`;
}

/** Por nombre, como lo lee una persona: sin distinguir mayúsculas ni tildes ("Énfasis" no cae al final). */
export function compareTypeNames(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

/** Los tipos activos, por orden alfabético: los que se ofrecen al crear un circuito, al cambiarle el tipo y al duplicarlo. */
export function activeTypesByName(
  types: readonly CircuitType[],
): CircuitType[] {
  return types
    .filter(({ active }) => active)
    .sort((a, b) => compareTypeNames(a.type, b.type));
}

/** Lo que responde el backend cuando el tipo del cuerpo no existe (404) o está dado de baja (400). */
const TYPE_NOT_FOUND = 'Tipo de circuito no encontrado';
const TYPE_INACTIVE = 'El tipo de circuito está dado de baja.';

/**
 * El texto de un error del tipo al crear, editar o duplicar un circuito (CU-E-22 y CU-E-23, «El tipo
 * está dado de baja o no existe»), o `null` si el error es de otra cosa. Se mira antes que los otros
 * errores del circuito: «Circuito no encontrado» también es un 404, y el del circuito dado de baja
 * también dice «está dado de baja».
 */
export function circuitTypeSaveError(error: unknown): string | null {
  if (!isApiError(error)) return null;
  if (error.status === 404 && error.serverMessage === TYPE_NOT_FOUND) {
    return 'El tipo de circuito ya no existe. Elegí otro.';
  }
  if (error.status === 400 && error.serverMessage === TYPE_INACTIVE) {
    return 'El tipo de circuito se dio de baja mientras editabas. Elegí otro.';
  }
  return null;
}

/** Una opción del selector de tipo: el id y el texto que se ve. */
export interface CircuitTypeOption {
  id: string;
  label: string;
}

/** Cómo se ve un tipo dado de baja en el selector del editor, el único lugar donde se marca. */
function inactiveLabel(type: Pick<CircuitTypeRef, 'type'>): string {
  return `${type.type} (dado de baja)`;
}

/**
 * Las opciones del selector «Tipo» del editor de circuitos (CU-E-22 y CU-E-23), sin la vacía: los tipos
 * activos por orden alfabético y, antes, los que el circuito necesita mostrar aunque no estén entre
 * ellos, marcados como dados de baja:
 *
 * - `saved`, el tipo que el circuito tiene guardado: se puede conservar aunque esté de baja. Sin la
 *   lista de activos (cargando o con error) es la única opción, con su estado de cuando se abrió.
 * - `picked`, el que se eligió en este formulario y ya no está entre los activos (el Admin lo dio de
 *   baja mientras se editaba): queda elegido para que se vea lo que se va a mandar, y el backend lo
 *   rechaza al guardar.
 */
export function circuitTypeOptions({
  actives,
  saved,
  picked,
}: {
  actives?: readonly CircuitType[];
  saved?: CircuitTypeRef;
  picked?: CircuitTypeRef | null;
}): CircuitTypeOption[] {
  if (!actives) {
    return saved
      ? [
          {
            id: saved.id,
            label: saved.active ? saved.type : inactiveLabel(saved),
          },
        ]
      : [];
  }
  const activeIds = new Set(actives.map(({ id }) => id));
  const extra = [saved, picked].filter(
    (type, index, all): type is CircuitTypeRef =>
      !!type &&
      !activeIds.has(type.id) &&
      all.findIndex((other) => other?.id === type.id) === index,
  );
  return [
    ...extra.map((type) => ({ id: type.id, label: inactiveLabel(type) })),
    ...actives.map(({ id, type }) => ({ id, label: type })),
  ];
}
