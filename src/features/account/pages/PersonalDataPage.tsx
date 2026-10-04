import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import type { User } from '@/api/types';
import { getErrorMessage, isApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Columns,
  ErrorState,
  Field,
  Input,
  Note,
  PageHeader,
  PhoneField,
  Skeleton,
  VisuallyHidden,
  useToast,
} from '@/shared/ui';

import { useEditProfile } from '../hooks/useEditProfile';
import { useUser } from '../hooks/useUser';
import { profileSchema, type ProfileValues } from '../schemas';
import styles from './PersonalDataPage.module.css';

/** Datos personales (CU-U-06): se precargan con `GET /users/get/{id}` y se guardan con `POST /users/edit`. */
export function PersonalDataPage() {
  const { user } = useAuth();
  // La ruta pide sesión, así que siempre hay usuario.
  if (!user) return null;
  return <PersonalData userId={user.id} />;
}

function PersonalData({ userId }: { userId: string }) {
  const query = useUser(userId);

  return (
    <>
      <PageHeader eyebrow="Mi cuenta" title="Datos personales" back="/cuenta" />
      <div className={styles.narrow}>
        {query.isPending ? (
          <FormSkeleton />
        ) : query.isError ? (
          <ErrorState
            message={getErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
            retrying={query.isRefetching}
          />
        ) : (
          <ProfileForm user={query.data} />
        )}
      </div>
    </>
  );
}

function SkeletonField() {
  return (
    <div className={styles.skeletonField}>
      <Skeleton width={72} height={12} />
      <Skeleton height={46} radius={12} />
    </div>
  );
}

/** La forma del formulario mientras llegan los datos. */
function FormSkeleton() {
  return (
    <div aria-busy="true">
      <VisuallyHidden role="status">Cargando tus datos…</VisuallyHidden>
      <Columns>
        <SkeletonField />
        <SkeletonField />
      </Columns>
      <SkeletonField />
      <SkeletonField />
      <SkeletonField />
      <Skeleton height={48} radius={14} />
    </div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const toast = useToast();
  const edit = useEditProfile();

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    // Con `values`, si el usuario cambia en el servidor (el caché estaba viejo y llega el dato
    // nuevo) el formulario se pone al día, y con `keepDirtyValues` sin pisar lo que ya se escribió.
    values: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_prefix: user.phone_prefix ?? '+54',
      phone_number: user.phone_number ?? '',
      profile_picture: user.profile_picture ?? '',
    },
    resetOptions: { keepDirtyValues: true },
  });

  const onSubmit = handleSubmit((values) => {
    if (edit.isPending) return;
    edit.mutate(values, {
      onSuccess: () => {
        toast.success('Datos actualizados');
        navigate('/cuenta');
      },
      onError: (error) => {
        if (isApiError(error) && error.status === 409) {
          setError('email', {
            type: 'server',
            message: 'El email ya está en uso',
          });
          setFocus('email');
        }
      },
    });
  });

  // Un 409 se muestra en el campo del email; los demás errores, en un aviso arriba.
  const emailTaken = isApiError(edit.error) && edit.error.status === 409;
  const phoneError =
    errors.phone_prefix?.message ?? errors.phone_number?.message;

  return (
    <form onSubmit={onSubmit} noValidate>
      {edit.isError && !emailTaken && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {getErrorMessage(edit.error)}
        </Note>
      )}
      <Columns>
        <Field label="Nombre" error={errors.first_name?.message}>
          <Input autoComplete="given-name" {...register('first_name')} />
        </Field>
        <Field label="Apellido" error={errors.last_name?.message}>
          <Input autoComplete="family-name" {...register('last_name')} />
        </Field>
      </Columns>
      <Field label="Email" error={errors.email?.message}>
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          {...register('email')}
        />
      </Field>
      <PhoneField
        error={phoneError}
        prefixProps={register('phone_prefix')}
        numberProps={register('phone_number')}
        prefixInvalid={Boolean(errors.phone_prefix)}
        numberInvalid={Boolean(errors.phone_number)}
      />
      <Field
        label="Foto de perfil (link)"
        error={errors.profile_picture?.message}
        hint="Opcional. Pegá el link de una imagen."
      >
        <Input
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://…"
          {...register('profile_picture')}
        />
      </Field>
      <Button type="submit" loading={edit.isPending}>
        Guardar cambios
      </Button>
    </form>
  );
}
