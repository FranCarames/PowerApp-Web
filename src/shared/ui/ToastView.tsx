import { useEffect, useRef } from 'react';

import { Icon } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './ToastView.module.css';
import { VisuallyHidden } from './VisuallyHidden';

export interface ToastData {
  /** Cambia con cada toast, aunque el mensaje se repita. */
  id: number;
  message: string;
  tone: 'ok' | 'err';
}

// Tiempos del prototipo: 2,4 s visible y 0,25 s de fundido.
const VISIBLE_MS = 2400;
const FADE_MS = 250;

// Con la API Popover el toast vive en la capa superior del navegador, por encima de cualquier
// <dialog> abierto. Sin ella, queda como un elemento fixed común.
const supportsPopover =
  typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

export function ToastView({ toast }: { toast: ToastData | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const toastId = toast?.id;

  useEffect(() => {
    const element = ref.current;
    if (toastId === undefined || !element) return;

    if (supportsPopover) {
      // Se vuelve a mostrar para quedar arriba de lo último que se haya abierto.
      if (element.matches(':popover-open')) element.hidePopover();
      element.showPopover();
    }
    // Fuerza el estilo inicial (oculto) para que la entrada se anime.
    void element.offsetWidth;
    element.classList.add(styles.show);

    const hide = setTimeout(
      () => element.classList.remove(styles.show),
      VISIBLE_MS,
    );
    const detach = setTimeout(() => {
      if (supportsPopover && element.matches(':popover-open')) {
        element.hidePopover();
      }
    }, VISIBLE_MS + FADE_MS);

    return () => {
      clearTimeout(hide);
      clearTimeout(detach);
    };
  }, [toastId]);

  return (
    <>
      {/* Anuncio para lectores de pantalla. La región existe siempre, así el cambio de texto se lee. */}
      <VisuallyHidden role="status" aria-live="polite">
        {toast?.message}
      </VisuallyHidden>
      <div
        ref={ref}
        popover={supportsPopover ? 'manual' : undefined}
        aria-hidden="true"
        className={styles.toast}
      >
        <div className={cx(styles.body, toast?.tone === 'err' && styles.err)}>
          <Icon
            name={toast?.tone === 'err' ? 'alert' : 'check'}
            size={18}
            className={styles.icon}
          />
          <span>{toast?.message}</span>
        </div>
      </div>
    </>
  );
}
