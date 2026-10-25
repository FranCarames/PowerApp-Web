import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { getErrorMessage } from '@/api/errors';
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

import {
  DUPLICATE_COACH_MESSAGE,
  duplicateCoachField,
  takenCoachField,
} from '../coachErrors';
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

/** Sin los dígitos de más: el CUIL se guarda y se compara de a 11 dígitos. */
function digits(cuil: string): string {
  return cuil.replace(/\D/g, '');
}

/**
 * La edición de un entrenador (CU-A-18), en un modal: el email profesional y el CUIL, que son los datos
 * del `Coach`. El nombre y la cuenta son del usuario y no se tocan desde acá (el caso de uso los deja
 * fuera). Se guarda con `POST /coach/promote_user` (ver `useEditCoach`).
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
  /** Los registros de Coach que se conocen, para avisar de un email o un CUIL repetido. */
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

    // El email y el CUIL no se repiten entre entrenadores, ni con uno dado de baja (CU-A-18): si ya se
    // sabe que otro los usa, no se manda. Los propios no cuentan.
    const taken = takenCoachField(others, coach.id, values);
    if (taken) {
      setError(taken, { message: DUPLICATE_COACH_MESSAGE[taken] });
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
      { user_id: coach.id, ...values },
      {
        onSuccess: () => {
          toast.success('Entrenador actualizado');
          onSaved();
        },
        onError: (error) => {
          // El CU pide decir cuál está repetido: va junto a su campo.
          const duplicate = duplicateCoachField(error);
          if (duplicate) {
            setError(duplicate, {
              type: 'server',
              message: DUPLICATE_COACH_MESSAGE[duplicate],
            });
          }
        },
      },
    );
  });

  return (
    <form id={id} onSubmit={onSubmit} noValidate>
      {/* Un dato repetido ya se muestra junto a su campo. */}
      {edit.isError && !duplicateCoachField(edit.error) && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {getErrorMessage(edit.error, {
            404: 'El entrenador ya no existe. Cerrá esta ventana y volvé a intentar.',
            // Un 409 que no dice cuál de los dos está repetido.
            409: 'Ya hay otro entrenador con ese email profesional o con ese CUIL.',
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
