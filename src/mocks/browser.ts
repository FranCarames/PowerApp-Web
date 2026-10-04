import { setupWorker } from 'msw/browser';

import { mocks } from './handlers';
import { endpointKey, isMocked, registry } from './registry';

/** Avisa de lo que no cierra entre el registry y los handlers: casi siempre es un olvido. */
function warnAboutMismatches(): void {
  const withHandler = new Set(
    mocks.map((mock) => endpointKey(mock.method, mock.path)),
  );
  const inRegistry = new Set(
    registry.map((entry) => endpointKey(entry.method, entry.path)),
  );

  for (const entry of registry) {
    const key = endpointKey(entry.method, entry.path);
    if (entry.mock && !withHandler.has(key)) {
      console.warn(
        `[mocks] ${key} está en mock: true en registry.ts pero no tiene handler: va al backend real.`,
      );
    }
  }
  for (const key of withHandler) {
    if (!inRegistry.has(key)) {
      console.warn(
        `[mocks] ${key} tiene handler pero no figura en registry.ts: no se mockea.`,
      );
    }
  }
}

/**
 * Registra el service worker de MSW y responde los endpoints marcados `mock: true` en el registry.
 * Lo demás sigue su camino al backend real. Se llama una vez, antes del primer render.
 */
export async function startMocks(): Promise<void> {
  warnAboutMismatches();

  const handlers = mocks
    .filter((mock) => isMocked(mock.method, mock.path))
    .map((mock) => mock.handler);

  await setupWorker(...handlers).start({
    // Lo que no está mockeado no genera avisos: se espera que vaya al backend.
    onUnhandledFrame: 'bypass',
    // `public/mockServiceWorker.js`, que Vite sirve (y copia a `dist`) desde la raíz de la app.
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}
