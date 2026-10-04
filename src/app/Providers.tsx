import type { ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { ToastProvider } from '@/shared/ui';

/** Providers globales de la app. Acá se suma el QueryClient (T05). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
