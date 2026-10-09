// El temporizador de descanso (CU-U-14) vive acá, fuera de React, como la sesión: así sigue corriendo
// cuando el alumno cambia de pantalla (la pantalla se desmonta) y avisa al terminar aunque esté en
// otra. No persiste nada: si se recarga la página, arranca de cero.
//
// El tiempo se calcula contra el reloj (`endsAt`) y no contando ticks: el navegador frena los timers de
// una pestaña en segundo plano o con el celular bloqueado, y el descanso tiene que durar lo que dura.

/** Las duraciones que se ofrecen, en segundos. */
export const REST_PRESETS = [30, 60, 90, 120, 180] as const;

/** Con lo que arranca la pantalla: el descanso del medio. */
const DEFAULT_TOTAL = 90;
/** Cada cuánto se recalcula lo que queda, mientras corre. */
const TICK_MS = 250;

export type RestTimerStatus = 'idle' | 'running' | 'paused' | 'done';

export interface RestTimerState {
  /** La duración elegida, en segundos. */
  total: number;
  /** Lo que queda, en segundos enteros (se redondea para arriba: con 0,2 s por delante se ve 1). */
  left: number;
  status: RestTimerStatus;
}

let state: RestTimerState = {
  total: DEFAULT_TOTAL,
  left: DEFAULT_TOTAL,
  status: 'idle',
};
/** Con `running`: la marca de tiempo (ms) en que termina. */
let endsAt = 0;
/** Con `paused`: los ms que quedaban al pausar. */
let remainingMs = 0;
let ticker: ReturnType<typeof setInterval> | null = null;

const changeListeners = new Set<() => void>();
const doneListeners = new Set<() => void>();

function setState(next: RestTimerState): void {
  state = next;
  changeListeners.forEach((listener) => listener());
}

/** El estado actual. Es el mismo objeto hasta que algo cambia. */
export function getRestTimer(): RestTimerState {
  return state;
}

/** Para `useSyncExternalStore`: avisa cuando cambia el estado. Devuelve cómo dejar de escuchar. */
export function subscribeRestTimer(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

/** Avisa cuando el descanso llega a cero (no cuando se pausa ni se reinicia). Devuelve cómo dejar de escuchar. */
export function onRestTimerDone(listener: () => void): () => void {
  doneListeners.add(listener);
  return () => doneListeners.delete(listener);
}

function secondsOf(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

/** Recalcula lo que queda y, si llegó a cero, termina. */
function tick(): void {
  if (state.status !== 'running') {
    stopTicker();
    return;
  }
  const left = secondsOf(endsAt - Date.now());
  if (left === 0) {
    stopTicker();
    setState({ ...state, left: 0, status: 'done' });
    doneListeners.forEach((listener) => listener());
  } else if (left !== state.left) {
    setState({ ...state, left });
  }
}

// Al volver a la pestaña no se espera al próximo tick: el navegador pudo haberlos frenado.
function onVisibilityChange(): void {
  if (!document.hidden) tick();
}

function startTicker(): void {
  if (ticker !== null) return;
  ticker = setInterval(tick, TICK_MS);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function stopTicker(): void {
  if (ticker === null) return;
  clearInterval(ticker);
  ticker = null;
  document.removeEventListener('visibilitychange', onVisibilityChange);
}

function run(total: number, ms: number): void {
  endsAt = Date.now() + ms;
  setState({ total, left: secondsOf(ms), status: 'running' });
  startTicker();
}

/** Elige una duración y arranca el conteo desde ahí, también si ya estaba corriendo. */
export function selectRestPreset(seconds: number): void {
  stopTicker();
  run(seconds, seconds * 1000);
}

/**
 * El botón principal: inicia (o repite, si ya terminó), pausa y reanuda. Una pausa conserva los
 * milisegundos que quedaban.
 */
export function toggleRestTimer(): void {
  switch (state.status) {
    case 'running':
      // Si el tiempo ya se cumplió entre un tick y otro, termina en lugar de pausar en cero.
      tick();
      if (state.status !== 'running') return;
      remainingMs = Math.max(0, endsAt - Date.now());
      stopTicker();
      setState({ ...state, left: secondsOf(remainingMs), status: 'paused' });
      return;
    case 'paused':
      run(state.total, remainingMs);
      return;
    case 'idle':
    case 'done':
      run(state.total, state.total * 1000);
      return;
  }
}

/** Vuelve al inicio de la duración elegida, sin correr. */
export function resetRestTimer(): void {
  stopTicker();
  if (state.status === 'idle' && state.left === state.total) return;
  setState({ total: state.total, left: state.total, status: 'idle' });
}

/** Lo deja como al abrir la app: se usa al cerrar la sesión, para que otra cuenta no herede un conteo ni una duración. */
export function clearRestTimer(): void {
  stopTicker();
  if (
    state.status === 'idle' &&
    state.total === DEFAULT_TOTAL &&
    state.left === DEFAULT_TOTAL
  ) {
    return;
  }
  setState({ total: DEFAULT_TOTAL, left: DEFAULT_TOTAL, status: 'idle' });
}
