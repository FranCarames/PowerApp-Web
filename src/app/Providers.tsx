import type { ReactNode } from 'react';

import { ToastProvider } from '@/shared/ui';

/** Providers globales de la app. Acá se suman el QueryClient (T05) y la sesión (T07). */
export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
