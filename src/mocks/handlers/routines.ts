import { HttpResponse } from 'msw/http';

import type { CircuitDetail } from '@/api/pending';
import type { CreateCircuitBody, RoutineListItemPlus } from '@/api/types';

import { staffAccess, withoutInactive } from '../access';
import { mockEndpoint, mockPendingEndpoint } from '../endpoint';
import {
  circuitDetails,
  circuitExerciseRef,
  toListItem,
  toPlusItem,
} from '../fixtures/circuits';
import { routines, routinesPlus } from '../fixtures/routines';
import { guardError, serviceError } from '../responses';

// Los circuitos viven en memoria: lo que se crea, edita, da de baja o reactiva se ve en los listados, en el
// detalle, en el panel y en las rutinas que lo usan, hasta que se recarga la página. Los listados sin los
// filtros `keyword` y `type`: la pantalla de circuitos busca en el front.
const circuits = new Map<string, CircuitDetail>(
  circuitDetails.map((circuit) => [circuit.id, circuit]),
);
let nextCircuit = circuitDetails.length + 1;
let nextRecord = 1;

/** Los circuitos de hoy, ordenados por nombre como los manda el backend. */
function currentCircuits(): CircuitDetail[] {
  return [...circuits.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'es'),
  );
}

/** Las rutinas con sus circuitos al día: si un circuito cambió de nombre, tipo o estado, sus rutinas lo ven. */
function currentRoutinesPlus(): RoutineListItemPlus[] {
  return routinesPlus.map((routine) => ({
    ...routine,
    circuits: routine.circuits.map((link) => {
      const circuit = circuits.get(link.circuit.id);
      return circuit
        ? {
            ...link,
            circuit: {
              id: circuit.id,
              name: circuit.name,
              type: circuit.type,
              active: circuit.active,
            },
          }
        : link;
    }),
  }));
}

/** Un valor que no es un entero (o no está en el rango) como lo diría class-validator, o `null` si está bien. */
function integerError(
  path: string,
  value: unknown,
  [min, max]: [number, number | null],
): string | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return `${path} must be an integer number`;
  }
  if (value < min) return `${path} must not be less than ${min}`;
  if (max !== null && value > max) {
    return `${path} must not be greater than ${max}`;
  }
  return null;
}

/** Los errores de un bloque de series (`CreateCircuitSetDto`), con la ruta de class-validator. */
function setErrors(set: Record<string, unknown>, path: string): string[] {
  const optionalInt = (key: string, range: [number, number | null]) =>
    set[key] === undefined
      ? null
      : integerError(`${path}.${key}`, set[key], range);
  const weight = set.weight;
  return [
    integerError(`${path}.set_count`, set.set_count, [1, 20]),
    integerError(`${path}.rep_count`, set.rep_count, [1, 1000]),
    weight === undefined
      ? null
      : typeof weight !== 'number' || weight < 0.01 || weight > 1000
        ? `${path}.weight must be a number between 0.01 and 1000`
        : null,
    optionalInt('rpe', [1, 10]),
    optionalInt('rir', [0, 10]),
    optionalInt('rm_perc', [1, 125]),
    optionalInt('amrap_time', [1, null]),
    set.amrap !== undefined && typeof set.amrap !== 'boolean'
      ? `${path}.amrap must be a boolean value`
      : null,
    set.rm !== undefined && typeof set.rm !== 'boolean'
      ? `${path}.rm must be a boolean value`
      : null,
  ].filter((message): message is string => message !== null);
}

/** Los errores del body (`CreateCircuitDto` y `EditCircuitDto`) como los manda la validación de los DTOs. */
function bodyErrors(body: unknown): string[] {
  const data = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  const text = (key: string, max: number, required: boolean) => {
    const value = data[key];
    if (value === undefined && !required) return;
    if (typeof value !== 'string' || value === '') {
      errors.push(`${key} should not be empty`);
    } else if (value.length > max) {
      errors.push(`${key} must be shorter than or equal to ${max} characters`);
    }
  };
  text('name', 100, true);
  text('description', 100, false);
  text('type', 30, true);

  if (!Array.isArray(data.exercises) || data.exercises.length === 0) {
    errors.push('exercises should not be empty');
    return errors;
  }
  for (const [index, entry] of data.exercises.entries()) {
    const exercise = (entry ?? {}) as Record<string, unknown>;
    const path = `exercises.${index}`;
    if (
      typeof exercise.exercise_id !== 'string' ||
      exercise.exercise_id === ''
    ) {
      errors.push(`${path}.exercise_id should not be empty`);
    }
    const note = exercise.coach_note;
    if (
      note !== undefined &&
      (typeof note !== 'string' || note === '' || note.length > 100)
    ) {
      errors.push(
        `${path}.coach_note must be shorter than or equal to 100 characters`,
      );
    }
    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      errors.push('Cada ejercicio debe tener al menos una serie');
      continue;
    }
    for (const [setIndex, set] of exercise.sets.entries()) {
      errors.push(
        ...setErrors(
          (set ?? {}) as Record<string, unknown>,
          `${path}.sets.${setIndex}`,
        ),
      );
    }
  }
  return errors;
}

/** Las reglas del service (`validateCircuitPayload`), con sus mismos textos. Devuelve la primera que se incumple. */
function ruleViolation(body: CreateCircuitBody): string | null {
  const ids = body.exercises.map(({ exercise_id }) => exercise_id);
  if (new Set(ids).size !== ids.length) {
    return 'El circuito no puede repetir el mismo ejercicio. Si necesitás el mismo movimiento dos veces, usá una variación del catálogo.';
  }
  for (const [exerciseIndex, exercise] of body.exercises.entries()) {
    for (const [setIndex, set] of exercise.sets.entries()) {
      const where = `ejercicio ${exerciseIndex + 1}, serie ${setIndex + 1}`;
      if (set.amrap_time !== undefined && set.amrap !== true) {
        return `En ${where}: amrap_time sólo puede enviarse con amrap = true.`;
      }
      if (set.rpe !== undefined && set.rir !== undefined) {
        return `En ${where}: rpe y rir son mutuamente excluyentes, son la misma escala invertida.`;
      }
      if (set.rm === true && set.set_count !== 1) {
        return `En ${where}: una serie marcada como rm debe tener set_count = 1. Para dos intentos, enviá dos series iguales.`;
      }
    }
  }
  return null;
}

/** Los ejercicios y las series del body, con los ids y el orden que arma el backend (la posición en la lista). */
function buildExercises(
  body: CreateCircuitBody,
  previous: CircuitDetail['exercises'] = [],
): CircuitDetail['exercises'] | null {
  const built: CircuitDetail['exercises'] = [];
  for (const [position, entry] of body.exercises.entries()) {
    const exercise = circuitExerciseRef(entry.exercise_id);
    if (!exercise) return null;
    // Un ejercicio que ya estaba conserva su registro (el backend lo mantiene o lo reactiva).
    const existing = previous.find(
      ({ exercise: other }) => other.id === exercise.id,
    );
    const id = existing?.id ?? `demo-record-${nextRecord++}`;
    built.push({
      id,
      exercise_order: position + 1,
      ...(entry.coach_note && { coach_note: entry.coach_note }),
      exercise,
      sets: entry.sets.map((set, setPosition) => ({
        id: `${id}-set-${nextRecord++}`,
        set_order: setPosition + 1,
        set_count: set.set_count,
        rep_count: set.rep_count,
        ...(set.weight !== undefined && { weight: set.weight }),
        ...(set.rpe !== undefined && { rpe: set.rpe }),
        ...(set.rir !== undefined && { rir: set.rir }),
        ...(set.rm_perc !== undefined && { rm_perc: set.rm_perc }),
        amrap: set.amrap ?? false,
        ...(set.amrap_time !== undefined && { amrap_time: set.amrap_time }),
        rm: set.rm ?? false,
      })),
    });
  }
  return built;
}

/** Los mocks de circuitos y rutinas. Cuáles están encendidos lo dice `registry.ts`. */
export const routineMocks = [
  // Los circuitos son REAL: el mock atiende solo a las cuentas de demo, por su token falso.
  mockEndpoint('get', '/api/v1/routine/circuit/all', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(
      withoutInactive(currentCircuits(), request).map(toListItem),
    );
  }),

  // Los mismos circuitos con sus ejercicios (`all-plus`).
  mockEndpoint('get', '/api/v1/routine/circuit/all-plus', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(
      withoutInactive(currentCircuits(), request).map(toPlusItem),
    );
  }),

  // El detalle, también de un circuito dado de baja. El contrato declara el `exercise` de cada
  // ejercicio como un objeto vacío (V2), así que se mockea con el tipo provisional.
  mockPendingEndpoint<undefined, CircuitDetail>(
    'get',
    '/api/v1/routine/circuit/{id}',
    ({ request, params }) => {
      const denied = staffAccess(request);
      if (denied) return denied;
      const circuit = circuits.get(params.id);
      return circuit
        ? HttpResponse.json(circuit)
        : serviceError(404, 'Circuito no encontrado');
    },
  ),

  // Alta (201): valida como el backend (los DTOs, las reglas del service y que los ejercicios existan) y
  // responde con el detalle. El circuito nace activo.
  mockPendingEndpoint<CreateCircuitBody, CircuitDetail>(
    'post',
    '/api/v1/routine/circuit/create',
    async ({ request }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      const body = await request.clone().json();
      const errors = bodyErrors(body);
      if (errors.length > 0) return guardError(400, errors);
      const violation = ruleViolation(body);
      if (violation) return serviceError(400, violation);
      const exercises = buildExercises(body);
      if (!exercises) {
        return serviceError(404, 'Algunos ejercicios no fueron encontrados');
      }

      const now = new Date().toISOString();
      const circuit: CircuitDetail = {
        id: `demo-circuit-${nextCircuit++}`,
        name: body.name,
        ...(body.description && { description: body.description }),
        type: body.type,
        active: true,
        created_at: now,
        updated_at: now,
        exercises,
      };
      circuits.set(circuit.id, circuit);
      return HttpResponse.json(circuit, { status: 201 });
    },
  ),

  // Edición (200): el circuito completo, con la lista de ejercicios tal como quedó. Un circuito dado de baja
  // no se edita (400) y la cabecera se pisa entera: sin `description`, se borra.
  mockPendingEndpoint<CreateCircuitBody, CircuitDetail>(
    'post',
    '/api/v1/routine/circuit/edit/{id}',
    async ({ request, params }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      const body = await request.clone().json();
      const errors = bodyErrors(body);
      if (errors.length > 0) return guardError(400, errors);
      const violation = ruleViolation(body);
      if (violation) return serviceError(400, violation);

      const circuit = circuits.get(params.id);
      if (!circuit) return serviceError(404, 'Circuito no encontrado');
      if (!circuit.active) {
        return serviceError(
          400,
          `El circuito "${circuit.name}" está dado de baja y no se puede editar. Reactivalo primero.`,
        );
      }
      const exercises = buildExercises(body, circuit.exercises);
      if (!exercises) {
        return serviceError(404, 'Algunos ejercicios no fueron encontrados');
      }

      const edited: CircuitDetail = {
        id: circuit.id,
        name: body.name,
        ...(body.description && { description: body.description }),
        type: body.type,
        active: true,
        created_at: circuit.created_at,
        updated_at: new Date().toISOString(),
        exercises,
      };
      circuits.set(edited.id, edited);
      return HttpResponse.json(edited);
    },
  ),

  // Baja lógica y reactivación (CU-E-24): un solo endpoint. No toca las rutinas que lo usan.
  mockEndpoint(
    'post',
    '/api/v1/routine/circuit/set-active/{id}',
    async ({ request, params }) => {
      const denied = staffAccess(request);
      if (denied) return denied;

      const { active } = await request.clone().json();
      if (typeof active !== 'boolean') {
        return guardError(400, ['active must be a boolean value']);
      }
      const circuit = circuits.get(params.id);
      if (!circuit) return serviceError(404, 'Circuito no encontrado');

      const changed = {
        ...circuit,
        active,
        updated_at: new Date().toISOString(),
      };
      circuits.set(changed.id, changed);
      return HttpResponse.json({
        id: changed.id,
        name: changed.name,
        type: changed.type,
        active: changed.active,
        created_at: changed.created_at,
        updated_at: changed.updated_at,
      });
    },
  ),

  mockEndpoint('get', '/api/v1/routine/all', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(routines, request));
  }),

  // Las mismas rutinas con sus circuitos (`all-plus`).
  mockEndpoint('get', '/api/v1/routine/all-plus', ({ request }) => {
    const denied = staffAccess(request);
    if (denied) return denied;
    return HttpResponse.json(withoutInactive(currentRoutinesPlus(), request));
  }),
];
