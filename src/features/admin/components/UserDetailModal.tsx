import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { User } from '@/api/types';
import { useSetUserActive } from '@/features/account/hooks/useSetUserActive';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLE_LABEL } from '@/features/auth/roles';
import { fullName } from '@/shared/lib/fullName';
import {
  Button,
  ConfirmDialog,
  DetailList,
  Modal,
  useToast,
} from '@/shared/ui';

import { CoachDetails } from './CoachDetails';
import { StudentDetails } from './StudentDetails';

interface UserDetailModalProps {
  /** El usuario a mostrar. Con `null` el modal está cerrado. */
  user: User | null;
  onClose: () => void;
}

/**
 * El detalle de un usuario (CU-E-03 desde el Admin): sus datos según su rol y las acciones sobre la
 * cuenta. Convertir a un alumno en entrenador abre T36 con el alumno elegido. Desactivar la cuenta es
 * una baja lógica y pide confirmación; reactivarla, no. Los admins no se desactivan desde acá, ni
 * uno mismo.
 */
export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user: me } = useAuth();
  const setActive = useSetUserActive();
  const [confirming, setConfirming] = useState(false);

  function changeActive(target: User, active: boolean) {
    setActive.mutate(
      { id: target.id, active },
      {
        onSuccess: () => {
          toast.success(active ? 'Cuenta reactivada' : 'Cuenta desactivada');
          setConfirming(false);
          onClose();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
          setConfirming(false);
        },
      },
    );
  }

  const canManage =
    user !== null && user.role !== 'admin' && user.id !== me?.id;

  return (
    <>
      <Modal
        open={user !== null && !confirming}
        onClose={onClose}
        title={user ? fullName(user) : ''}
        description={
          user &&
          `${ROLE_LABEL[user.role]} · cuenta ${user.active ? 'activa' : 'inactiva'}`
        }
        actions={
          user && (
            <>
              {canManage && user.role === 'user' && user.active && (
                <Button
                  variant="sec"
                  onClick={() => navigate(`/a/convertir?alumno=${user.id}`)}
                >
                  Convertir en entrenador
                </Button>
              )}
              {canManage &&
                (user.active ? (
                  <Button variant="danger" onClick={() => setConfirming(true)}>
                    Desactivar cuenta
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    loading={setActive.isPending}
                    onClick={() => changeActive(user, true)}
                  >
                    Reactivar cuenta
                  </Button>
                ))}
              <Button variant="ghost" onClick={onClose}>
                Cerrar
              </Button>
            </>
          )
        }
      >
        {user?.role === 'user' && <StudentDetails user={user} />}
        {user?.role === 'coach' && <CoachDetails user={user} />}
        {user?.role === 'admin' && (
          <DetailList items={[{ label: 'Email', value: user.email }]} />
        )}
      </Modal>
      <ConfirmDialog
        open={user !== null && confirming}
        destructive
        title="Desactivar cuenta"
        message={
          user && (
            <>
              ¿Desactivar la cuenta de <b>{fullName(user)}</b>? Es una baja
              lógica: no va a poder ingresar, pero sus datos se conservan y la
              podés reactivar cuando quieras.
            </>
          )
        }
        confirmLabel="Desactivar"
        loading={setActive.isPending}
        onConfirm={() => user && changeActive(user, false)}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
