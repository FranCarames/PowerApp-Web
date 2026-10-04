import { Link, useNavigate } from 'react-router';

import type { Role } from '@/api/types';
import { Button, Note } from '@/shared/ui';

import { BrandBlock } from '../components/BrandBlock';
import { useAuth } from '../hooks/useAuth';
import { mockSession } from '../mockSession';
import { HOME_BY_ROLE } from '../roles';
import styles from './LoginPage.module.css';

const DEMO_ROLES: { role: Role; label: string }[] = [
  { role: 'user', label: 'Usuario' },
  { role: 'coach', label: 'Entrenador' },
  { role: 'admin', label: 'Admin' },
];

// TEMPORAL (T09): el formulario real reemplaza esta pantalla.
export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  function enterAs(role: Role) {
    signIn(mockSession(role));
    navigate(HOME_BY_ROLE[role], { replace: true });
  }

  return (
    <>
      <title>Iniciar sesión · PowerApp</title>
      <BrandBlock />
      <Note tone="acc" icon="key">
        El formulario de inicio de sesión llega con la tarea T09. Mientras
        tanto, entrá con una sesión de prueba.
      </Note>
      <div className={styles.demo}>
        <p className={styles.caption}>
          Sesión de prueba: elegí con qué rol entrar
        </p>
        <div className={styles.roles}>
          {DEMO_ROLES.map(({ role, label }) => (
            <Button key={role} variant="sec" onClick={() => enterAs(role)}>
              Entrar como {label}
            </Button>
          ))}
        </div>
        {import.meta.env.DEV && (
          <Link to="/dev/ui" className={styles.devLink}>
            Galería de componentes
          </Link>
        )}
      </div>
    </>
  );
}
