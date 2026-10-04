import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { isApiError } from '@/api/errors';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Field,
  Input,
  LinkButton,
  Note,
  PasswordInput,
} from '@/shared/ui';

import { BrandBlock } from '../components/BrandBlock';
import { TempPasswordModal } from '../components/TempPasswordModal';
import { useAuth } from '../hooks/useAuth';
import { getLoginErrorMessage, useLogin } from '../hooks/useLogin';
import { homePathFor } from '../homePath';
import { loginSchema, type LoginValues } from '../schemas';
import type { Session } from '../session';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const login = useLogin();
  // La sesión de quien entró con una contraseña temporal: no se abre hasta que toque el botón del
  // modal. Si la abriéramos antes, el guard de contraseña pendiente lo llevaría a
  // /cambiar-contrasena sin que el modal llegue a verse.
  const [tempSession, setTempSession] = useState<Session | null>(null);

  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function enter(session: Session) {
    signIn(session);
    navigate(homePathFor(session), { replace: true });
  }

  const onSubmit = handleSubmit((values) => {
    if (login.isPending) return;
    login.mutate(values, {
      onSuccess: (session) => {
        if (session.passwordChangeRequired) setTempSession(session);
        else enter(session);
      },
      onError: (error) => {
        // Credenciales incorrectas: se vacía la contraseña y se vuelve a ella para reintentar.
        if (isApiError(error) && error.status === 401) {
          resetField('password');
          setFocus('password');
        }
      },
    });
  });

  return (
    <>
      <title>Iniciar sesión · PowerApp</title>
      <BrandBlock />
      <form onSubmit={onSubmit} noValidate>
        {login.isError && (
          <Note tone="err" icon="alert" role="alert" className={styles.error}>
            {getLoginErrorMessage(login.error)}
          </Note>
        )}
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            {...register('email')}
          />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Tu contraseña"
            {...register('password')}
          />
        </Field>
        <div className={styles.forgot}>
          <LinkButton onClick={() => navigate('/recuperar')}>
            ¿Olvidaste tu contraseña?
          </LinkButton>
        </div>
        <Button type="submit" loading={login.isPending}>
          Iniciar sesión
        </Button>
      </form>
      <div className={styles.or}>o</div>
      <Button
        variant="ghost"
        className={styles.register}
        onClick={() => navigate('/registro')}
      >
        Crear cuenta nueva
      </Button>
      {import.meta.env.DEV && (
        <div className={styles.devLinks}>
          <Link to="/dev/ui">Galería de componentes</Link>
          <Link to="/dev/api">Prueba de la API</Link>
        </div>
      )}
      <TempPasswordModal
        open={tempSession !== null}
        onContinue={() => tempSession && enter(tempSession)}
      />
    </>
  );
}
