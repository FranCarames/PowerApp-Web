import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Field,
  LinkButton,
  Note,
  PageHeader,
  PasswordInput,
  useToast,
} from '@/shared/ui';

import { PasswordRequirements } from '../components/PasswordRequirements';
import { useAuth } from '../hooks/useAuth';
import { useChangePassword } from '../hooks/useChangePassword';
import { homePathFor } from '../homePath';
import { changePasswordSchema, type ChangePasswordValues } from '../schemas';
import styles from './ChangePasswordPage.module.css';

/**
 * Cambiar la contraseña (CU-U-05), con las dos formas del caso de uso. El **obligatorio** es el de
 * quien entró con una contraseña temporal (`passwordChangeRequired`): es la única pantalla que puede
 * ver, y al terminar se libera el guard y va a su inicio. El **voluntario** se abre desde Mi cuenta y
 * vuelve a ella.
 */
export function ChangePasswordPage() {
  const { user, passwordChangeRequired, completePasswordChange, signOut } =
    useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const change = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    control,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const [newPassword, confirmPassword] = useWatch({
    control,
    name: ['new_password', 'confirm_password'],
  });
  const requirements = [
    {
      label: 'Entre 6 y 50 caracteres',
      met: newPassword.length >= 6 && newPassword.length <= 50,
    },
    {
      label: 'Las dos contraseñas coinciden',
      met: confirmPassword !== '' && confirmPassword === newPassword,
    },
  ];

  // La ruta pide sesión (RequireSession), así que siempre hay usuario.
  if (!user) return null;

  const onSubmit = handleSubmit((values) => {
    if (change.isPending) return;
    change.mutate(values, {
      onSuccess: () => {
        toast.success('Contraseña actualizada');
        if (passwordChangeRequired) {
          completePasswordChange();
          navigate(homePathFor({ user }), { replace: true });
        } else {
          navigate('/cuenta');
        }
      },
      onError: (error) => {
        // Un 401 de este endpoint es "la contraseña actual no coincide", no una sesión vencida.
        if (isApiError(error) && error.status === 401) {
          setError('current_password', {
            type: 'server',
            message: 'La contraseña actual es incorrecta',
          });
          setFocus('current_password');
        }
      },
    });
  });

  const wrongCurrent = isApiError(change.error) && change.error.status === 401;

  return (
    <>
      {passwordChangeRequired ? (
        <PageHeader eyebrow="Paso 3 de 3" title="Nueva contraseña" />
      ) : (
        <PageHeader
          eyebrow="Seguridad"
          title="Cambiar contraseña"
          back="/cuenta"
        />
      )}
      {passwordChangeRequired && (
        <Note tone="warn" icon="key">
          Ingresaste con una contraseña temporal. Creá una nueva para terminar
          de recuperar tu cuenta.
        </Note>
      )}
      <form onSubmit={onSubmit} noValidate>
        {change.isError && !wrongCurrent && (
          <Note tone="err" icon="alert" role="alert" className={styles.error}>
            {getErrorMessage(change.error)}
          </Note>
        )}
        <Field
          label="Contraseña actual"
          error={errors.current_password?.message}
          hint={
            passwordChangeRequired
              ? 'Es la contraseña temporal con la que ingresaste.'
              : undefined
          }
        >
          <PasswordInput
            autoComplete="current-password"
            placeholder="Tu contraseña actual"
            {...register('current_password')}
          />
        </Field>
        <Field label="Nueva contraseña" error={errors.new_password?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            {...register('new_password')}
          />
        </Field>
        <Field
          label="Repetir contraseña"
          error={errors.confirm_password?.message}
        >
          <PasswordInput
            autoComplete="new-password"
            placeholder="Repetí la contraseña"
            {...register('confirm_password')}
          />
        </Field>
        <PasswordRequirements items={requirements} />
        <Button type="submit" loading={change.isPending}>
          {passwordChangeRequired
            ? 'Guardar y continuar'
            : 'Guardar contraseña'}
        </Button>
      </form>
      {passwordChangeRequired && (
        // Con el cambio pendiente no se puede ir a ningún otro lado: esta es la salida.
        <div className={styles.signOut}>
          <LinkButton onClick={signOut}>Cerrar sesión</LinkButton>
        </div>
      )}
    </>
  );
}
