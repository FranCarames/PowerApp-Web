import { useNavigate } from 'react-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button, Note } from '@/shared/ui';

import styles from './CircuitTypeNotice.module.css';

interface CircuitTypeNoticeProps {
  /** Los tipos activos, si ya llegaron. */
  actives?: unknown[];
  /** Si el pedido de los tipos falló. */
  failed: boolean;
  /** Mientras se vuelven a pedir después del error. */
  retrying: boolean;
  onRetry: () => void;
  /** Un alta (sin tipo para conservar) o la edición de un circuito que ya tiene el suyo. */
  isNew: boolean;
}

/**
 * Lo que el editor de circuitos avisa sobre los tipos, debajo del campo «Tipo»: que no se pudieron
 * cargar (con Reintentar) o que no hay ninguno activo (CU-E-22, camino alternativo «Sin tipos de
 * circuito activos»). En el alta, sin tipos no se puede guardar; en la edición, el circuito conserva
 * el suyo. Al Admin le ofrece ir a Tipos de circuito; al Entrenador, que se lo pida al Admin.
 */
export function CircuitTypeNotice({
  actives,
  failed,
  retrying,
  onRetry,
  isNew,
}: CircuitTypeNoticeProps) {
  const navigate = useNavigate();
  const isAdmin = useAuth().user?.role === 'admin';

  if (failed && !actives) {
    return (
      <>
        <Note tone="err" icon="alert" role="alert">
          No pudimos cargar los tipos de circuito.
        </Note>
        <Button
          variant="sec"
          sm
          loading={retrying}
          className={styles.action}
          onClick={onRetry}
        >
          Reintentar
        </Button>
      </>
    );
  }

  if (actives?.length !== 0) return null;

  return (
    <>
      <Note tone="warn" icon="alert" role="status">
        {isNew
          ? `No hay tipos de circuito activos: hace falta uno para crear un circuito.${isAdmin ? '' : ' Pedile al admin que cree uno o que reactive alguno.'}`
          : 'No hay tipos de circuito activos: el circuito conserva el suyo, pero por ahora no se le puede cambiar.'}
      </Note>
      {isAdmin && (
        <Button
          variant="sec"
          sm
          className={styles.action}
          onClick={() => navigate('/a/tipos-circuito')}
        >
          Ir a Tipos de circuito
        </Button>
      )}
    </>
  );
}
