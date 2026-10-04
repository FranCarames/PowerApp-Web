import { rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Con los mocks apagados, el service worker de MSW no se publica: nada lo registra. Con
 * `VITE_USE_MOCKS=true` queda en `dist` (Vite copia `public/` entero) para el deploy en Render.
 */
function omitMockWorker(useMocks: boolean): Plugin {
  let outDir = '';
  return {
    name: 'powerapp:omit-mock-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    // `closeBundle` corre después de que Vite copió `public/` a `dist`.
    closeBundle() {
      if (!useMocks)
        rmSync(join(outDir, 'mockServiceWorker.js'), { force: true });
    },
  };
}

// El alias @/ → src/ sale de "paths" en tsconfig.json.
export default defineConfig(({ mode }) => {
  // API_PROXY_TARGET no empieza con VITE_, así que no llega al navegador: es solo del servidor.
  const env = loadEnv(mode, '.', '');

  // Las requests a /api van al backend y el navegador las ve como del mismo origen: sin CORS.
  const proxy = {
    '/api': {
      target: env.API_PROXY_TARGET || 'http://localhost:3000',
      changeOrigin: true,
    },
  };

  return {
    plugins: [react(), omitMockWorker(env.VITE_USE_MOCKS === 'true')],
    resolve: { tsconfigPaths: true },
    server: { proxy },
    // `npm run preview` también prueba el build contra el backend local.
    preview: { proxy },
  };
});
