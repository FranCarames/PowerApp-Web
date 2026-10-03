import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// El alias @/ → src/ sale de "paths" en tsconfig.json.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
});
