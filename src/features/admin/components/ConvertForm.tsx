import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { Coach, User } from '@/api/types';
import { formatCuil } from '@/shared/lib/format';
import { fullName } from '@/shared/lib/fullName';
import { zodResolver } from '@/shared/lib/zodResolver';
import { Button, Note, useToast } from '@/shared/ui';

import {
  DUPLICATE_COACH_MESSAGE,
  duplicateCoachField,
  takenCoachField,
} from '../coachErrors';
import { useConvertToCoach } from '../hooks/useConvertToCoach';
import {
  coachDataSchema,
  type CoachDataInput,
  type CoachDataValues,
} from '../schemas';
import { CoachDataFields } from './CoachDataFields';
import styles from './ConvertForm.module.css';

interface ConvertFormProps {
  /** El alumno elegido. Sin él, el botón queda apagado. */
  student: User | null;
  /** Su registro de Coach anterior, si ya fue entrenador: el formulario arranca con esos datos. */
  previous: Coach | undefined;
  /** Los registros de Coach que ya existen, para avisar de un email o un CUIL repetido antes de mandarlo. */
  coaches: Coach[] | undefined;
}

/**
 * Lo que falta para convertir a un alumno (CU-A-17): el email profesional y el CUIL, y el botón. Va
 * con `key` por el registro anterior del alumno: al elegir a alguien que ya fue entrenador, el
 * formulario arranca de nuevo con los datos que tenía.
 */
export function ConvertForm({ student, previous, coaches }: ConvertFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const convert = useConvertToCoach();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CoachDataInput, unknown, CoachDataValues>({
    resolver: zodResolver(coachDataSchema),
    defaultValues: {
      coach_email: previous?.coach_email ?? '',
      cuil: previous ? formatCuil(previous.cuil) : '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (!student || convert.isPending) return;

    // El email y el CUIL no se repiten entre entrenadores, ni con uno dado de baja (CU-A-17): si ya se
    // sabe que otro los usa, no se manda. El backend responde lo mismo con un 409.
    const taken = takenCoachField(coaches, student.id, values);
    if (taken) {
      setError(taken, { message: DUPLICATE_COACH_MESSAGE[taken] });
      return;
    }

    convert.mutate(
      { user_id: student.id, ...values },
      {
        onSuccess: () => {
          toast.success(`${fullName(student)} ahora es entrenador`);
          navigate('/a/entrenadores');
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

  // El error es de un intento con este alumno: al elegir a otro, no corresponde.
  // Un dato repetido ya se muestra junto a su campo.
  const failed =
    convert.isError &&
    convert.variables.user_id === student?.id &&
    !duplicateCoachField(convert.error);

  return (
    <form onSubmit={onSubmit} noValidate>
      {student && (
        <p className={styles.target}>
          Se convierte a <b>{fullName(student)}</b>
          <span className={styles.email}>{student.email}</span>
        </p>
      )}
      {previous && (
        <Note tone="acc" icon="shield" className={styles.note}>
          Esta cuenta ya fue de entrenador. Al convertirla se reactiva su
          registro y se reemplazan el email profesional y el CUIL por los de
          acá.
        </Note>
      )}
      {failed && (
        <Note tone="err" icon="alert" role="alert" className={styles.note}>
          {getErrorMessage(convert.error, {
            404: 'El alumno ya no existe. Elegí a otro de la lista.',
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
      <Button type="submit" disabled={!student} loading={convert.isPending}>
        Convertir en entrenador
      </Button>
    </form>
  );
}
