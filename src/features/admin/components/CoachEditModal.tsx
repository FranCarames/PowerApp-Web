import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { Coach, User } from '@/api/types';
import { formatCuil } from '@/shared/lib/format';
import { fullName } from '@/shared/lib/fullName';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  LinkButton,
  Modal,
  Note,
  Skeleton,
  useToast,
} from '@/shared/ui';

import { useCoach } from '../hooks/useCoach';
import { coachesQuery } from '../hooks/useCoaches';
import { useEditCoach } from '../hooks/useEditCoach';
import {
  coachDataSchema,
  type CoachDataInput,
  type CoachDataValues,
} from '../schemas';
import { CoachDataFields } from './CoachDataFields';
import styles from './CoachEditModal.module.css';

interface CoachEditModalProps {
  /** El entrenador a editar, o `null` con el modal cerrado. */
  user: User | null;
  onClose: () => void;
}

/**
 * Si el backend no tiene la ruta: Nest responde 404 con `statusCode`, a diferencia del 404 de un service
 * (`{ error }`, un entrenador que no existe). Mientras B8 no esté en el contrato, es lo que pasa contra
 * un backend de verdad.
 */
function isMissingRoute(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.status === 404 &&
    typeof error.body === 'object' &&
    error.body !== null &&
    'statusCode' in error.body
  );
}

/** Sin los dígitos de más: el CUIL se guarda y se compara de a 11 dígitos. */
function digits(cuil: string): string {
  return cuil.replace(/\D/g, '');
}

/**
 * La edición de un entrenador (CU-A-18), en un modal: el email profesional y el CUIL, que son los datos
 * del `Coach`. El nombre y la cuenta son del usuario y no se tocan desde acá (el caso de uso los deja
 * fuera). El endpoint todavía no existe en el contrato (B8): lo responde un mock.
 */
export function CoachEditModal({ user, onClose }: CoachEditModalProps) {
  const formId = useId();
  const edit = useEditCoach();
  // Los datos de hoy del entrenador, para llenar el formulario (es la misma query del detalle).
  const coach = useCoach(user?.id ?? null);
  // Los demás entrenadores, para avisar de un email repetido antes de mandarlo.
  const coaches = useQuery({ ...coachesQuery(), enabled: user !== null });

  function close() {
    // Un error del intento anterior no tiene que verse al volver a abrir el modal.
    edit.reset();
    onClose();
  }

  return (
    <Modal
      open={user !== null}
      onClose={close}
      blocking={edit.isPending}
      title="Editar entrenador"
      description={
        user && (
          <>
            Datos profesionales de <b>{fullName(user)}</b>. Su nombre y su
            cuenta los gestiona la propia persona.
          </>
        )
      }
      actions={
        <>
          <Button
            type="submit"
            form={formId}
            disabled={!coach.data}
            loading={edit.isPending}
          >
            Guardar
          </Button>
          <Button variant="ghost" disabled={edit.isPending} onClick={close}>
            Cancelar
          </Button>
        </>
      }
    >
      {user &&
        (coach.data ? (
          <CoachEditForm
            key={coach.data.id}
            id={formId}
            coach={coach.data}
            others={coaches.data}
            edit={edit}
            onSaved={close}
          />
        ) : coach.isError ? (
          <p role="alert">
            {getErrorMessage(coach.error, {
              404: 'No encontramos los datos profesionales de este entrenador.',
            })}{' '}
            <LinkButton
              onClick={() => void coach.refetch()}
              disabled={coach.isRefetching}
            >
              Reintentar
            </LinkButton>
          </p>
        ) : (
          <CoachEditSkeleton />
        ))}
    </Modal>
  );
}

interface CoachEditFormProps {
  id: string;
  coach: Coach;
  /** Los registros de Coach que se conocen, para avisar de un email repetido. */
  others: Coach[] | undefined;
  edit: ReturnType<typeof useEditCoach>;
  onSaved: () => void;
}

function CoachEditForm({
  id,
  coach,
  others,
  edit,
  onSaved,
}: CoachEditFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CoachDataInput, unknown, CoachDataValues>({
    resolver: zodResolver(coachDataSchema),
    defaultValues: {
      coach_email: coach.coach_email,
      cuil: formatCuil(coach.cuil),
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (edit.isPending) return;

    // La columna es única: si otro entrenador ya tiene ese email, no se manda.
    const takenByOther = others?.some(
      (other) =>
        other.id !== coach.id &&
        other.coach_email.toLowerCase() === values.coach_email,
    );
    if (takenByOther) {
      setError('coach_email', {
        message: 'Ya hay otro entrenador con ese email profesional',
      });
      return;
    }

    // Sin cambios no hay nada que guardar.
    if (
      values.coach_email === coach.coach_email.toLowerCase() &&
      values.cuil === digits(coach.cuil)
    ) {
      onSaved();
      return;
    }

    edit.mutate(
      { id: coach.id, ...values },
      {
        onSuccess: () => {
          toast.success('Entrenador actualizado');
          onSaved();
        },
      },
    );
  });

  return (
    <form id={id} onSubmit={onSubmit} noValidate>
      {edit.isError && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {isMissingRoute(edit.error)
            ? 'Editar entrenadores todavía no está disponible en el servidor. No se guardó nada.'
            : getErrorMessage(edit.error, {
                404: 'El entrenador ya no existe. Cerrá esta ventana y volvé a intentar.',
                409: 'Ya hay otro entrenador con ese email profesional.',
                // Todavía no se sabe qué responde el backend: el motivo más probable es el email repetido.
                500: 'No se pudo guardar. Puede que el email profesional ya lo use otro entrenador.',
              })}
        </Note>
      )}
      <CoachDataFields
        register={register}
        setValue={setValue}
        errors={errors}
      />
    </form>
  );
}

/** Los dos campos en gris mientras llegan los datos del entrenador. */
function CoachEditSkeleton() {
  return (
    <div aria-busy="true">
      {[0, 1].map((field) => (
        <div key={field} className={styles.skeletonField}>
          <Skeleton width={90} height={12} radius={6} />
          <Skeleton height={49} radius={12} />
        </div>
      ))}
    </div>
  );
}
