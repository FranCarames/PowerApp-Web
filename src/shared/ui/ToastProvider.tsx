import { useMemo, useRef, useState, type ReactNode } from 'react';

import { ToastContext, type ToastApi } from './toastContext';
import { ToastView, type ToastData } from './ToastView';

/** Provee `useToast()` y dibuja el toast. Muestra uno por vez: un toast nuevo reemplaza al anterior. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const lastId = useRef(0);

  const api = useMemo<ToastApi>(() => {
    const show = (message: string, tone: ToastData['tone']) => {
      lastId.current += 1;
      setToast({ id: lastId.current, message, tone });
    };
    return {
      success: (message) => show(message, 'ok'),
      error: (message) => show(message, 'err'),
    };
  }, []);

  return (
    <ToastContext value={api}>
      {children}
      <ToastView toast={toast} />
    </ToastContext>
  );
}
