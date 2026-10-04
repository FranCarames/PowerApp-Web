import { useNavigate } from 'react-router';

import { Button, EmptyState, Note, PageHeader } from '@/shared/ui';

import { useAuth } from '../hooks/useAuth';
import { homePathFor } from '../homePath';
import styles from './ChangePasswordPage.module.css';

// TEMPORAL (T12): el formulario de cambio de contraseña reemplaza esta pantalla. Los botones son solo
// para probar el guard de contraseña pendiente (T07): simular el cambio hecho y cerrar sesión.
export function ChangePasswordPage() {
  const { user, passwordChangeRequired, completePasswordChange, signOut } =
    useAuth();
  const navigate = useNavigate();

  function simulateChange() {
    if (!user) return;
    completePasswordChange();
    navigate(homePathFor({ user }), { replace: true });
  }

  return (
    <>
      <PageHeader title="Nueva contraseña" />
      {passwordChangeRequired && (
        <Note tone="warn" icon="alert">
          Entraste con una contraseña temporal: tenés que cambiarla para seguir.
        </Note>
      )}
      <EmptyState
        icon="key"
        title="Pantalla en construcción"
        message="Cambiar la contraseña se arma en la tarea T12."
        action={
          <div className={styles.actions}>
            {passwordChangeRequired && (
              <Button sm variant="sec" onClick={simulateChange}>
                Simular cambio hecho
              </Button>
            )}
            <Button sm variant="ghost" onClick={signOut}>
              Cerrar sesión
            </Button>
          </div>
        }
      />
    </>
  );
}
