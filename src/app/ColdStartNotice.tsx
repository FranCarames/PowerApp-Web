import { useSyncExternalStore } from 'react';

import { isServerWaking, subscribeServerWaking } from '@/api/coldStart';
import { Spinner, VisuallyHidden } from '@/shared/ui';

import styles from './ColdStartNotice.module.css';

const MESSAGE = 'Despertando el servidor, puede tardar un poco…';

// Con la API Popover el aviso vive en la capa superior del navegador, por encima de cualquier
// <dialog> abierto (ver ToastView). Sin ella, queda como un elemento fixed común.
const supportsPopover =
  typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

/**
 * Aviso global de arranque en frío: aparece cuando un request pasa de `COLD_START_HINT_MS` sin que
 * el backend conteste, y desaparece cuando contesta. No corta ni bloquea nada.
 */
export function ColdStartNotice() {
  const waking = useSyncExternalStore(subscribeServerWaking, isServerWaking);

  return (
    <>
      {/* La región existe siempre, así el cambio de texto se anuncia a los lectores de pantalla. */}
      <VisuallyHidden role="status" aria-live="polite">
        {waking ? MESSAGE : ''}
      </VisuallyHidden>
      {waking && (
        <div
          ref={(element) => {
            if (supportsPopover) element?.showPopover();
          }}
          popover={supportsPopover ? 'manual' : undefined}
          aria-hidden="true"
          className={styles.notice}
        >
          <div className={styles.body}>
            <Spinner size={16} label={null} />
            <span>{MESSAGE}</span>
          </div>
        </div>
      )}
    </>
  );
}
