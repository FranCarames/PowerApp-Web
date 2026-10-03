import { useRef, type ReactNode } from 'react';

import type { IconName } from '@/shared/icons';

import { Button } from './Button';
import { Modal } from './Modal';
import type { Tone } from './tone';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Qué se va a hacer y con qué consecuencias. Admite <b> para resaltar el nombre. */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Baja o acción irreversible: botón rojo relleno y, por defecto, tono de error. */
  destructive?: boolean;
  icon?: IconName;
  tone?: Tone;
  /** Mientras es true los botones se bloquean y el diálogo no se puede cerrar. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  icon = 'alert',
  tone = destructive ? 'err' : 'warn',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // El foco inicial va al botón menos riesgoso: un Enter apurado no confirma.
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      icon={icon}
      tone={tone}
      blocking={loading}
      initialFocusRef={cancelRef}
      actions={
        <>
          <Button
            variant={destructive ? 'danger' : 'pri'}
            solid={destructive}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button
            ref={cancelRef}
            variant="ghost"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        </>
      }
    />
  );
}
