import { z } from 'zod';

import type { RoutineTree } from '@/api/pending';
import type { EditRoutineBody } from '@/api/types';

// El formulario de una rutina (CU-E-16 y CU-E-17): `CreateRoutineDto` y `EditRoutineDto`, que tienen las
// mismas reglas salvo que la edición suma el `id` del vínculo de cada circuito. El nombre es de hasta 50
// caracteres; la nota del entrenador, opcional, de hasta 100 (un texto vacío no se manda: en la edición, omitirla
// la borra). Lleva de 1 a 50 circuitos y un mismo circuito puede repetirse.

/** La cantidad máxima de circuitos de una rutina. */
export const ROUTINE_CIRCUITS_MAX = 50;

const routineCircuitSchema = z.object({
  /**
   * Quién es la tarjeta en el formulario: el id del vínculo guardado o uno propio si es nuevo. Como un circuito
   * puede repetirse en la rutina, `circuit_id` no alcanza para señalar a una; el `slot` sí, y sobrevive
   * al ir y volver del editor de circuitos.
   */
  slot: z.string().min(1),
  /** El id del vínculo `Routine_Circuit` guardado (no el del circuito). Vacío si el vínculo es nuevo. */
  link_id: z.string(),
  circuit_id: z.string().min(1),
});

export const routineSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Poné un nombre a la rutina')
      .max(50, 'El nombre no puede tener más de 50 caracteres'),
    coach_note: z
      .string()
      .trim()
      .max(100, 'La nota no puede tener más de 100 caracteres'),
    circuits: z
      .array(routineCircuitSchema)
      .min(1, 'Agregá al menos un circuito')
      .max(
        ROUTINE_CIRCUITS_MAX,
        `Una rutina no puede tener más de ${ROUTINE_CIRCUITS_MAX} circuitos`,
      ),
  })
  .transform(({ name, coach_note, circuits }): EditRoutineBody => ({
    name,
    ...(coach_note !== '' && { coach_note }),
    // El orden de la lista es el de la rutina. Un ítem con `id` es un vínculo que se mantiene; uno sin él, uno nuevo.
    circuits: circuits.map(({ link_id, circuit_id }, index) => ({
      ...(link_id !== '' && { id: link_id }),
      circuit_id,
      order: index + 1,
    })),
  }));

export type RoutineInput = z.input<typeof routineSchema>;
export type RoutineValues = z.output<typeof routineSchema>;
export type RoutineCircuitInput = RoutineInput['circuits'][number];

let slotCount = 0;

/** Un lugar nuevo para la tarjeta de un circuito que se agrega: sin vínculo guardado, con un `slot` propio. */
export function newRoutineCircuit(circuitId: string): RoutineCircuitInput {
  slotCount += 1;
  return {
    slot: `nuevo-${Date.now()}-${slotCount}`,
    link_id: '',
    circuit_id: circuitId,
  };
}

/**
 * Los valores iniciales del formulario: los de una rutina ya guardada o, sin ella, una rutina en blanco.
 * El backend manda `null` en la nota que no tiene, aunque el contrato la declara opcional.
 */
export function routineDefaultValues(routine?: RoutineTree): RoutineInput {
  return {
    name: routine?.name ?? '',
    coach_note: routine?.coach_note ?? '',
    circuits: [...(routine?.circuits ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(({ id, circuit }) => ({
        slot: id,
        link_id: id,
        circuit_id: circuit.id,
      })),
  };
}

/**
 * Lo que el editor de circuitos le deja pendiente a la rutina de la que vino: sumar el circuito que
 * creó o reemplazar un circuito de la rutina por su copia (al duplicarlo desde ella).
 */
export type RoutineOp =
  | { type: 'append'; circuitId: string }
  | { type: 'replace'; slot: string; circuitId: string };

/**
 * Aplica lo pendiente, en orden, sobre los valores de la rutina. Reemplazar deja el lugar de la tarjeta
 * (mismo `slot`) con un vínculo nuevo al circuito copia: el vínculo del original sale de la rutina al
 * guardar. Si el lugar ya no está, la copia se suma al final: es el circuito que se acaba de crear.
 */
export function applyRoutineOps(
  values: RoutineInput,
  ops: readonly RoutineOp[],
): RoutineInput {
  let circuits = values.circuits;
  for (const op of ops) {
    if (
      op.type === 'replace' &&
      circuits.some(({ slot }) => slot === op.slot)
    ) {
      circuits = circuits.map((circuit) =>
        circuit.slot === op.slot
          ? { slot: circuit.slot, link_id: '', circuit_id: op.circuitId }
          : circuit,
      );
    } else {
      circuits = [...circuits, newRoutineCircuit(op.circuitId)];
    }
  }
  return { ...values, circuits };
}
