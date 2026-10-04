import { Button, Modal } from '@/shared/ui';

interface TempPasswordModalProps {
  open: boolean;
  /** Lleva a /cambiar-contrasena. Es la única salida del modal. */
  onContinue: () => void;
}

/**
 * Aviso bloqueante al entrar con una contraseña temporal (CU-U-02): no se cierra con Escape ni
 * tocando el fondo, solo con el botón.
 */
export function TempPasswordModal({
  open,
  onContinue,
}: TempPasswordModalProps) {
  return (
    <Modal
      open={open}
      // Con `blocking` el modal nunca pide cerrarse: no hay nada que hacer acá.
      onClose={() => undefined}
      blocking
      icon="key"
      tone="warn"
      title="Actualizá tu contraseña"
      description="Estás usando una contraseña temporal. Por tu seguridad, tenés que crear una nueva antes de continuar."
      actions={<Button onClick={onContinue}>Crear nueva contraseña</Button>}
    />
  );
}
