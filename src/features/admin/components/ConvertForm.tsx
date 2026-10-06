import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { Coach, User } from '@/api/types';
import { formatCuil } from '@/shared/lib/format';
import { fullName } from '@/shared/lib/fullName';
import { zodResolver } from '@/shared/lib/zodResolver';
import { Button, Note, useToast } from '@/shared/ui';

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
  /** Los registros de Coach que ya existen, para avisar de un email repetido antes de mandarlo. */
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

    // La columna es única y un email repetido es un 500 que, además, deja al usuario con el rol y sin
    // sus datos (el backend cambia el rol antes de guardar el `Coach`): si ya se conoce, no se manda.
    const takenByOther = coaches?.some(
      ({ id, coach_email }) =>
        id !== student.id && coach_email.toLowerCase() === values.coach_email,
    );
    if (takenByOther) {
      setError('coach_email', {
        message: 'Ya hay otro entrenador con ese email profesional',
      });
      return;
    }

    convert.mutate(
      { user_id: student.id, ...values },
      {
        onSuccess: () => {
          toast.success(`${fullName(student)} ahora es entrenador`);
          navigate('/a/entrenadores');
        },
      },
    );
  });

  // El error es de un intento con este alumno: al elegir a otro, no corresponde.
  const failed = convert.isError && convert.variables.user_id === student?.id;

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
            // El único 500 que se conoce es el del email repetido, con el rol ya cambiado.
            500: 'No se pudo completar la conversión. Puede que el email profesional ya lo use otro entrenador. Revisá en Entrenadores cómo quedó la cuenta antes de volver a intentar.',
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
