import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { queryClient } from '@/api/queryClient';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { RestTimerWatcher } from '@/features/user/components/RestTimerWatcher';
import { ToastProvider } from '@/shared/ui';

/** Providers globales de la app. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RestTimerWatcher />
          {children}
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
