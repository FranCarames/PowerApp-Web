import type { NavigationType } from 'react-router';

import type { RoutineInput, RoutineOp } from './routineSchema';

// Armar una rutina lleva a otras pantallas y vuelve: Editar un circuito, crear uno nuevo. El editor de rutina
// se desmonta en el camino, así que lo que el usuario ya escribió (el borrador) se guarda acá, en memoria, y
// el editor lo recupera al volver. Si se pierde (se recarga la página), la rutina se abre como está guardada.

/** El borrador de la rutina nueva: la ruta es `…/nuevo`, no tiene id. */
export const NEW_ROUTINE_KEY = 'nuevo';

/**
 * De dónde viene el editor de circuitos cuando se lo abrió desde una rutina (`state.routine` de la
 * navegación). Con esto Guardar y "Volver" regresan a la rutina y no a la lista de circuitos.
 */
export interface RoutineReturn {
  /** El editor de la rutina, al que se vuelve (`/a/rutinas/<id>` o `/a/rutinas/nuevo`). */
  to: string;
  /** De qué borrador es: el id de la rutina o `nuevo`. */
  routineId: string;
  /** La tarjeta de la rutina cuyo circuito se edita. Sin ella, el circuito que se está creando es nuevo. */
  slot?: string;
}

/** El `state` de la navegación hacia el editor de circuitos. */
export interface CircuitEditorState {
  routine: RoutineReturn;
}

/** El `state` de la navegación de vuelta al editor de rutina: que recupere el borrador que dejó. */
export const RESTORE_DRAFT_STATE = { restoreDraft: true } as const;

/** La rutina de la que se vino al editor de circuitos, si se vino de una (se lee del `state` de la ruta). */
export function readRoutineReturn(state: unknown): RoutineReturn | undefined {
  if (typeof state !== 'object' || state === null) return undefined;
  const { routine } = state as Partial<CircuitEditorState>;
  if (typeof routine !== 'object' || routine === null) return undefined;
  const { to, routineId, slot } = routine as Partial<RoutineReturn>;
  if (typeof to !== 'string' || typeof routineId !== 'string') return undefined;
  return { to, routineId, slot: typeof slot === 'string' ? slot : undefined };
}

/**
 * Si el editor de rutina tiene que recuperar su borrador: cuando se vuelve a él (de un circuito, o con
 * Atrás). Abrirlo desde el listado empieza de cero, y lo que haya quedado guardado se descarta.
 */
export function shouldRestoreDraft(
  state: unknown,
  navigationType: NavigationType,
): boolean {
  return (
    navigationType === 'POP' ||
    (typeof state === 'object' &&
      state !== null &&
      (state as { restoreDraft?: unknown }).restoreDraft === true)
  );
}

/** Lo que dejó guardado una rutina al salir a otra pantalla. */
export interface RoutineStash {
  /** Lo que había escrito, tal cual. Falta si lo único pendiente es lo que dejó el editor de circuitos. */
  values?: RoutineInput;
  ops: RoutineOp[];
}

const stashes = new Map<string, RoutineStash>();

/** Guarda lo que hay escrito en la rutina antes de salir. Empieza de nuevo: lo pendiente anterior ya no vale. */
export function stashRoutineDraft(
  routineId: string,
  values: RoutineInput,
): void {
  stashes.set(routineId, { values, ops: [] });
}

/** Deja pendiente algo para cuando se vuelva a la rutina: sumar un circuito o reemplazar uno. */
export function queueRoutineOp(routineId: string, op: RoutineOp): void {
  const stash = stashes.get(routineId);
  stashes.set(routineId, { ...stash, ops: [...(stash?.ops ?? []), op] });
}

/** Lo guardado de una rutina, sin sacarlo (se lee al armar el formulario, que React puede repetir). */
export function peekRoutineStash(routineId: string): RoutineStash | undefined {
  return stashes.get(routineId);
}

/** Descarta lo guardado de una rutina: el editor ya lo usó, o se abrió de cero. */
export function clearRoutineStash(routineId: string): void {
  stashes.delete(routineId);
}
