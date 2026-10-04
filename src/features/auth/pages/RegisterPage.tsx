import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Columns,
  Field,
  Input,
  Note,
  PageHeader,
  PasswordInput,
  useToast,
} from '@/shared/ui';

import { useRegister } from '../hooks/useRegister';
import { registerSchema, type RegisterValues } from '../schemas';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const signUp = useRegister();
  // El <Field> del teléfono le da su id al número, que es el que lleva la etiqueta "Teléfono". El
  // código de país necesita el suyo, o los dos controles compartirían id.
  const prefixId = useId();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_prefix: '+54',
      phone_number: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (signUp.isPending) return;
    signUp.mutate(values, {
      onSuccess: () => {
        // CU-U-01: después del alta se vuelve al login (no se abre sesión).
        toast.success('Cuenta creada. Iniciá sesión para empezar.');
        navigate('/login', { replace: true });
      },
      onError: (error) => {
        if (isApiError(error) && error.status === 409) setFocus('email');
      },
    });
  });

  const emailTaken = isApiError(signUp.error) && signUp.error.status === 409;
  // El teléfono son dos controles bajo una sola etiqueta: el aviso es el del primero que falle.
  const phoneError =
    errors.phone_prefix?.message ?? errors.phone_number?.message;

  return (
    <>
      <PageHeader title="Crear cuenta" back="/login" />
      <p className={styles.subtitle}>Empezá tu camino fitness</p>
      <form onSubmit={onSubmit} noValidate>
        {signUp.isError && (
          <Note tone="err" icon="alert" role="alert" className={styles.error}>
            {emailTaken ? (
              <>
                Ya existe una cuenta con ese email.{' '}
                <Link to="/login" className={styles.link}>
                  Iniciá sesión
                </Link>{' '}
                o{' '}
                <Link to="/recuperar" className={styles.link}>
                  recuperá tu contraseña
                </Link>
                .
              </>
            ) : (
              getErrorMessage(signUp.error)
            )}
          </Note>
        )}
        <Columns>
          <Field label="Nombre" error={errors.first_name?.message}>
            <Input
              autoComplete="given-name"
              placeholder="Franco"
              {...register('first_name')}
            />
          </Field>
          <Field label="Apellido" error={errors.last_name?.message}>
            <Input
              autoComplete="family-name"
              placeholder="Carames"
              {...register('last_name')}
            />
          </Field>
        </Columns>
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            {...register('email')}
          />
        </Field>
        <Field label="Teléfono" error={phoneError}>
          <div className={styles.phone}>
            <Input
              id={prefixId}
              aria-label="Código de país"
              autoComplete="tel-country-code"
              invalid={Boolean(errors.phone_prefix)}
              {...register('phone_prefix')}
            />
            <Input
              type="tel"
              autoComplete="tel-national"
              placeholder="11 2345 6789"
              invalid={Boolean(errors.phone_number)}
              {...register('phone_number')}
            />
          </div>
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            {...register('password')}
          />
        </Field>
        <Button
          type="submit"
          className={styles.submit}
          loading={signUp.isPending}
        >
          Registrarme
        </Button>
        <p className={styles.terms}>
          Al registrarte aceptás los Términos y Condiciones
        </p>
      </form>
    </>
  );
}
