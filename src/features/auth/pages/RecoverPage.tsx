import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Field,
  Input,
  LinkButton,
  Modal,
  Note,
  PageHeader,
  Tile,
} from '@/shared/ui';

import { useRecoverPassword } from '../hooks/useRecoverPassword';
import { recoverSchema, type RecoverValues } from '../schemas';
import styles from './RecoverPage.module.css';

export function RecoverPage() {
  const navigate = useNavigate();
  const recover = useRecoverPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverValues>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit((values) => {
    if (recover.isPending) return;
    recover.mutate(values);
  });

  return (
    <>
      <PageHeader
        eyebrow="Paso 1 de 3"
        title="Recuperar acceso"
        back="/login"
      />
      <Tile icon="key" tone="acc" size={64} className={styles.tile} />
      <p className={styles.intro}>
        Ingresá tu email y te enviamos una contraseña temporal para que puedas
        volver a entrar.
      </p>
      <form onSubmit={onSubmit} noValidate>
        {recover.isError && (
          <Note tone="err" icon="alert" role="alert" className={styles.error}>
            {getErrorMessage(recover.error, {
              server:
                'No pudimos enviar la contraseña temporal. Intentá de nuevo.',
            })}
          </Note>
        )}
        <Field label="Email registrado" error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            {...register('email')}
          />
        </Field>
        <Button type="submit" loading={recover.isPending}>
          {recover.isError ? 'Reintentar' : 'Enviar contraseña temporal'}
        </Button>
      </form>
      <div className={styles.back}>
        <LinkButton onClick={() => navigate('/login')}>
          Volver al inicio de sesión
        </LinkButton>
      </div>
      {/* Es el mismo aviso exista o no el email: por eso dice "si está registrado". Cerrarlo vuelve al
          formulario con el email escrito, para pedirla de nuevo. */}
      <Modal
        open={recover.isSuccess}
        onClose={() => recover.reset()}
        icon="mail"
        tone="ok"
        title="Revisá tu correo"
        description={
          <>
            Si <b>{recover.variables?.email}</b> está registrado, te enviamos
            una contraseña temporal. Usala para iniciar sesión y después vas a
            poder crear una nueva.
          </>
        }
        actions={
          <Button onClick={() => navigate('/login')}>
            Ir a iniciar sesión
          </Button>
        }
        footnote="¿No te llegó? Revisá spam o volvé a solicitarla."
      />
    </>
  );
}
