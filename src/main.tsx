import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Los estilos globales van primero: los CSS Modules de los componentes se cargan
// después y, a igual especificidad, pisan a los globales.
import '@/shared/styles/tokens.css';
import '@/shared/styles/global.css';

import { App } from '@/app/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento #root');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
