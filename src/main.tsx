import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Los estilos globales van primero: los CSS Modules de los componentes se cargan
// después y, a igual especificidad, pisan a los globales.
import '@/shared/styles/tokens.css';
import '@/shared/styles/global.css';

import { App } from '@/app/App';
import { connectApiToSession } from '@/app/connectApi';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento #root');
}

connectApiToSession();

/**
 * Con `VITE_USE_MOCKS=true` arranca MSW antes del primer render, para que intercepte hasta los
 * primeros requests. Vite reemplaza `import.meta.env.VITE_USE_MOCKS` por su valor al compilar: con
 * cualquier otro valor descarta este bloque y el import dinámico, y MSW no entra al bundle.
 */
async function enableMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  try {
    const { startMocks } = await import('@/mocks/browser');
    await startMocks();
  } catch (error) {
    // Sin el worker la app arranca igual, pero contra el backend real: se avisa fuerte.
    console.error(
      '[mocks] No se pudo iniciar MSW: las requests van al backend real.',
      error,
    );
  }
}

await enableMocks();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
