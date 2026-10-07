import { useId, useState } from 'react';
import { useSearchParams } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { User } from '@/api/types';
import { useUser } from '@/features/account/hooks/useUser';
import { fullName } from '@/shared/lib/fullName';
import { Note, PageHeader, Skeleton } from '@/shared/ui';

import { PaymentForm } from '../components/PaymentForm';
import { PaymentStudentPicker } from '../components/PaymentStudentPicker';
import styles from './RegisterPaymentPage.module.css';

/**
 * El alumno que llega elegido por `?alumno=<id>` (desde su detalle o desde el control de membresías)
 * o, si no se le puede registrar un pago, el motivo. Solo se registran pagos de alumnos: el backend no
 * mira el rol, pero un entrenador o un admin no tienen membresía. Uno de cuenta inactiva sí se acepta.
 */
function usePreselectedStudent(id: string | null): {
  loading: boolean;
  student?: User;
  problem?: string;
} {
  const query = useUser(id);
  if (id === null) return { loading: false };
  if (query.isPending) return { loading: true };
  if (query.isError) {
    return {
      loading: false,
      problem: getErrorMessage(query.error, {
        // Un id que no es un UUID da 400 y uno que no existe, 404.
        400: 'No encontramos al alumno que elegiste.',
        404: 'No encontramos al alumno que elegiste.',
      }),
    };
  }
  if (query.data.role !== 'user') {
    return {
      loading: false,
      problem: `${fullName(query.data)} no es un alumno: solo se registran pagos de alumnos.`,
    };
  }
  return { loading: false, student: query.data };
}

/**
 * Registrar pago (CU-E-29), en `/c/pago`: se elige al alumno (puede llegar elegido con `?alumno=<id>`)
 * y el tipo de membresía, se revisa el resumen y se confirma. Sirve para una alta y para renovar: no
 * existe "renovar" como operación aparte.
 */
export function RegisterPaymentPage() {
  const [params] = useSearchParams();
  const studentId = params.get('alumno');
  // Con otro alumno en la URL (Atrás o Adelante entre dos) la pantalla arranca de nuevo.
  return <RegisterPayment key={studentId ?? ''} studentId={studentId} />;
}

function RegisterPayment({ studentId }: { studentId: string | null }) {
  const preselected = usePreselectedStudent(studentId);
  // `undefined`: no se tocó nada y vale el alumno de la URL; `null`: se pidió cambiarlo.
  const [chosen, setChosen] = useState<User | null | undefined>(undefined);
  const labelId = useId();

  const student = chosen === undefined ? (preselected.student ?? null) : chosen;

  return (
    <>
      <PageHeader
        eyebrow={student ? fullName(student) : 'Membresías'}
        title="Registrar pago"
        back="/c/membresias"
      />
      <div className={styles.narrow}>
        {preselected.problem && chosen === undefined && (
          <Note tone="warn" icon="alert" className={styles.note}>
            {preselected.problem}
          </Note>
        )}
        <div role="group" aria-labelledby={labelId} className={styles.student}>
          <span id={labelId} className={styles.label}>
            Alumno
          </span>
          {preselected.loading && chosen === undefined ? (
            <Skeleton height={68} radius={16} />
          ) : (
            <PaymentStudentPicker student={student} onChange={setChosen} />
          )}
        </div>
        {student ? (
          <PaymentForm key={student.id} student={student} />
        ) : (
          <p className={styles.hint}>
            Elegí un alumno para elegir su tipo de membresía.
          </p>
        )}
      </div>
    </>
  );
}
