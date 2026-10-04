import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

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
    plugins: [react()],
    resolve: { tsconfigPaths: true },
    server: { proxy },
    // `npm run preview` también prueba el build contra el backend local.
    preview: { proxy },
  };
});
