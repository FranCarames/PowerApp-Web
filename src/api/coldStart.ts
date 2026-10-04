// Aviso de arranque en frío. El backend corre en el free tier de Render y se duerme: el primer
// request después de un rato puede tardar casi un minuto. El cliente cuenta los requests en vuelo y,
// si alguno pasa de COLD_START_HINT_MS sin respuesta, `isServerWaking()` pasa a `true` (sin cortar
// ningún request). Lo dibuja `app/ColdStartNotice`.

/** Cuánto puede tardar un request antes de avisar que el servidor está despertando. */
export const COLD_START_HINT_MS = 4000;

/**
 * Cuánto se mantiene el aviso cuando termina el último request sin que el servidor haya contestado
 * (error de red, 502, 503 o 504). Tiene que ser mayor que la espera entre reintentos de TanStack
 * Query (1 s y 2 s): así el aviso no parpadea mientras se reintenta.
 */
const LINGER_MS = 3000;

let waking = false;
let nextId = 0;
const inFlight = new Set<number>();
let lingerTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function setWaking(value: boolean): void {
  if (waking === value) return;
  waking = value;
  listeners.forEach((listener) => listener());
}

/** Si hay un request que pasó de COLD_START_HINT_MS sin que el servidor haya contestado. */
export function isServerWaking(): boolean {
  return waking;
}

/** Para `useSyncExternalStore`: avisa cuando cambia `isServerWaking()`. Devuelve cómo dejar de escuchar. */
export function subscribeServerWaking(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Registra un request que empieza. Devuelve la función que hay que llamar cuando termina, con
 * `serverResponded: true` si el backend contestó (con lo que sea, menos 502, 503 o 504) y `false` si
 * no hubo respuesta, la dio el proxy de la plataforma o el request se canceló.
 */
export function trackRequest(): (serverResponded: boolean) => void {
  const id = nextId++;
  inFlight.add(id);
  clearTimeout(lingerTimer);
  const slowTimer = setTimeout(() => setWaking(true), COLD_START_HINT_MS);

  return (serverResponded) => {
    clearTimeout(slowTimer);
    inFlight.delete(id);

    // Si el servidor contestó, está despierto, aunque algún otro request siga tardando.
    if (serverResponded) {
      setWaking(false);
    } else if (inFlight.size === 0) {
      lingerTimer = setTimeout(() => setWaking(false), LINGER_MS);
    }
  };
}
