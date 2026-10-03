import { useState } from 'react';

import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';

type OpenModal = 'form' | 'info' | 'blocking' | 'confirm' | 'loading' | null;

export function ModalsSection() {
  const toast = useToast();
  const [open, setOpen] = useState<OpenModal>(null);
  const [weight, setWeight] = useState('');
  const [closing, setClosing] = useState(false);

  function close() {
    setOpen(null);
    setWeight('');
  }

  function saveRm() {
    // Con el modal abierto, el toast de error tiene que verse por encima.
    if (!(Number(weight) > 0)) {
      toast.error('Ingresá un peso mayor a 0');
      return;
    }
    close();
    toast.success('RM registrado');
  }

  function closeAccount() {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      close();
      toast.success('Cuenta cerrada');
    }, 1500);
  }

  return (
    <GallerySection
      id="modales"
      title="Modales"
      description="Bottom sheet en mobile y diálogo centrado desde 960 px. Probá Escape, tocar el fondo y la tecla Tab."
    >
      <GalleryDemo label="Abrir">
        <Button sm onClick={() => setOpen('form')}>
          Formulario
        </Button>
        <Button sm variant="sec" onClick={() => setOpen('info')}>
          Con ícono
        </Button>
        <Button sm variant="ghost" onClick={() => setOpen('blocking')}>
          Bloqueante
        </Button>
        <Button sm variant="danger" onClick={() => setOpen('confirm')}>
          Confirmar baja
        </Button>
        <Button sm variant="danger" solid onClick={() => setOpen('loading')}>
          Confirmar con espera
        </Button>
      </GalleryDemo>

      <Modal
        open={open === 'form'}
        onClose={close}
        title="Registrar RM"
        description="Registrá el peso máximo que levantaste en una repetición."
        actions={
          <>
            <Button onClick={saveRm}>Guardar RM</Button>
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
          </>
        }
      >
        <Field label="Ejercicio">
          <Select defaultValue="Press de banca">
            <option>Press de banca</option>
            <option>Sentadilla</option>
            <option>Peso muerto</option>
          </Select>
        </Field>
        <Field label="Peso (kg)">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Ej: 80"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </Field>
      </Modal>

      <Modal
        open={open === 'info'}
        onClose={close}
        icon="mail"
        tone="ok"
        title="Revisá tu correo"
        description={
          <>
            Generamos una contraseña temporal y la enviamos a{' '}
            <b>franco@email.com</b>. Usala para iniciar sesión.
          </>
        }
        actions={<Button onClick={close}>Ir a iniciar sesión</Button>}
        footnote="¿No te llegó? Revisá spam o volvé a solicitarla."
      />

      <Modal
        open={open === 'blocking'}
        onClose={close}
        blocking
        icon="key"
        tone="warn"
        title="Actualizá tu contraseña"
        description="Estás usando una contraseña temporal. Por tu seguridad, tenés que crear una nueva antes de continuar."
        actions={<Button onClick={close}>Crear nueva contraseña</Button>}
        footnote="Escape y tocar el fondo no cierran este modal."
      />

      <ConfirmDialog
        open={open === 'confirm'}
        title="Eliminar RM"
        message={
          <>
            ¿Eliminar el RM de <b>Press de banca</b>? No se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        icon="trash"
        destructive
        onConfirm={() => {
          close();
          toast.success('RM eliminado');
        }}
        onCancel={close}
      />

      <ConfirmDialog
        open={open === 'loading'}
        title="Cerrar cuenta"
        message={
          <>
            <b>Tomás Ríos</b> va a dejar de tener acceso a la app. Podés
            reactivarla más adelante.
          </>
        }
        confirmLabel="Cerrar cuenta"
        destructive
        loading={closing}
        onConfirm={closeAccount}
        onCancel={close}
      />
    </GallerySection>
  );
}
