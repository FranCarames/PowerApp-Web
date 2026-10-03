import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react';

import { Icon, type IconName } from '@/shared/icons';
import { cx } from '@/shared/lib/cx';

import styles from './Modal.module.css';
import type { Tone } from './tone';

interface ModalProps {
  open: boolean;
  /** Se llama al pedir el cierre con Escape o tocando el fondo. Con `blocking` no se llama nunca. */
  onClose: () => void;
  title: string;
  /** Texto bajo el título. Admite <b> para resaltar. */
  description?: ReactNode;
  /** Ícono sobre el título, dentro de un cuadrado del color de `tone`. */
  icon?: IconName;
  tone?: Tone;
  /** Modal bloqueante: no se cierra con Escape ni tocando el fondo, solo con una de sus acciones. */
  blocking?: boolean;
  /** Contenido propio entre el título y las acciones: formularios, listas… */
  children?: ReactNode;
  /** Botones apilados al pie. */
  actions?: ReactNode;
  footnote?: ReactNode;
  /** Elemento que recibe el foco al abrir. Por defecto, el primero que se pueda enfocar. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Bottom sheet en mobile y diálogo centrado desde 960 px. Usa <dialog>.showModal(): el navegador
 * se ocupa de atrapar el foco, dejar inerte el resto de la página y devolver el foco al cerrar.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  tone = 'pri',
  blocking = false,
  children,
  actions,
  footnote,
  initialFocusRef,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocusRef]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // Escape. El estado lo manda el padre: el <dialog> se cierra cuando `open` pasa a false.
    event.preventDefault();
    if (!blocking) {
      onClose();
      return;
    }
    // Chrome no deja cancelar un Escape si no hubo una interacción del usuario desde el anterior
    // (el segundo seguido): cierra igual. Se lo vuelve a abrir apenas termina ese cierre. Se hace
    // acá y no en "close" porque ese evento llega recién en el siguiente frame.
    if (!event.cancelable) {
      setTimeout(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
      }, 0);
    }
  }

  function handleClose() {
    // Red de seguridad: el navegador cerró el <dialog> sin que el padre lo pidiera.
    // Si `open` ya es false, o el <dialog> se volvió a abrir, no hay nada que corregir.
    const dialog = dialogRef.current;
    if (!open || !dialog || dialog.open) return;
    if (blocking) dialog.showModal();
    else onClose();
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    // Los clics sobre el fondo llegan al propio <dialog>; el contenido vive en el panel de adentro.
    if (event.target === event.currentTarget && !blocking) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={handleClose}
      onClick={handleClick}
    >
      {open && (
        <div className={styles.sheet}>
          <div className={styles.grip} />
          {icon && (
            <div className={cx(styles.icon, styles[tone])}>
              <Icon name={icon} size={30} />
            </div>
          )}
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {description && <p className={styles.description}>{description}</p>}
          {children && <div className={styles.content}>{children}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
          {footnote && <p className={styles.footnote}>{footnote}</p>}
        </div>
      )}
    </dialog>
  );
}
