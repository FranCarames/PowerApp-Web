import { useContext } from 'react';

import { ToastContext } from './toastContext';

/** toast.success('Cuenta creada') / toast.error('No se pudo guardar'). Requiere <ToastProvider>. */
export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error('useToast tiene que usarse dentro de <ToastProvider>');
  }
  return toast;
}
