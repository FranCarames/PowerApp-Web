import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { User } from '@/api/types';
import { StudentDetails } from '@/features/account/components/StudentDetails';
import { useSetUserActive } from '@/features/account/hooks/useSetUserActive';
import { useUser } from '@/features/account/hooks/useUser';
import { formatMonthYear } from '@/shared/lib/dates';
import { fullName } from '@/shared/lib/fullName';
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  List,
  ListItem,
  PageHeader,
  Pill,
  Skeleton,
  Tile,
  useToast,
  VisuallyHidden,
} from '@/shared/ui';

import { StudentPaymentsModal } from '../components/StudentPaymentsModal';
import { StudentRmsModal } from '../components/StudentRmsModal';
import styles from './StudentDetailPage.module.css';

const BACK = '/c/alumnos';

/** Detalle de un alumno (CU-E-03 a CU-E-05), en `/c/alumnos/:id`. */
export function StudentDetailPage() {
  const { id } = useParams();
  const query = useUser(id ?? null);

  // Un id que no es un UUID da 400 y uno que no existe, 404. Cualquier cuenta que no sea de un alumno
  // tampoco se muestra acá: esta pantalla da de baja cuentas, y no son las de un entrenador ni un admin.
  const notFound =
    (isApiError(query.error) &&
      (query.error.status === 404 || query.error.status === 400)) ||
    (query.data !== undefined && query.data.role !== 'user');

  if (query.data && !notFound) return <StudentDetail student={query.data} />;

  return (
    <>
      <PageHeader eyebrow="Alumnos" title="Alumno" back={BACK} />
      {notFound ? (
        <ErrorState
          title="No encontramos al alumno"
          message="No hay ningún alumno con ese enlace. Volvé a la lista."
        />
      ) : query.isError ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      ) : (
        <DetailSkeleton />
      )}
    </>
  );
}

/** La forma del detalle mientras llega el alumno. */
function DetailSkeleton() {
  return (
    <div aria-busy="true">
      <VisuallyHidden role="status">Cargando el alumno…</VisuallyHidden>
      <div className={styles.head}>
        <Skeleton circle height={64} />
        <div>
          <Skeleton width={72} height={20} radius={999} />
          <Skeleton width={150} height={12} className={styles.sub} />
        </div>
      </div>
      <Skeleton height={150} radius={16} className={styles.details} />
      <Skeleton height={68} radius={16} />
    </div>
  );
}

function StudentDetail({ student }: { student: User }) {
  const navigate = useNavigate();
  const toast = useToast();
  const setActive = useSetUserActive();
  const [modal, setModal] = useState<'rms' | 'payments' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const name = fullName(student);

  function closeAccount() {
    setActive.mutate(
      { id: student.id, active: false },
      {
        onSuccess: () => {
          toast.success('Cuenta cerrada');
          navigate(BACK);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
          setConfirming(false);
        },
      },
    );
  }

  function reactivateAccount() {
    setActive.mutate(
      { id: student.id, active: true },
      {
        onSuccess: () => toast.success('Cuenta reactivada'),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <>
      <PageHeader eyebrow="Alumno" title={name} back={BACK} />
      <div className={styles.head}>
        <Avatar
          name={name}
          src={student.profile_picture}
          size={64}
          tone={student.active ? 'pri' : 'gray'}
        />
        <div>
          <Pill tone={student.active ? 'ok' : 'warn'}>
            {student.active ? 'Activo' : 'Inactivo'}
          </Pill>
          <div className={styles.sub}>
            Alumno desde {formatMonthYear(student.created_at)}
          </div>
        </div>
      </div>
      <Card className={styles.details}>
        <StudentDetails user={student} className={styles.fields} />
      </Card>
      <List columns={2}>
        <ListItem
          leading={<Tile icon="trophy" />}
          title="RMs del alumno"
          subtitle="Récords por ejercicio"
          chevron
          onClick={() => setModal('rms')}
        />
        {/* El historial de entrenamientos llega con T43. */}
        <ListItem
          leading={<Tile icon="list" />}
          title="Historial de entrenamientos"
          subtitle="Próximamente"
        />
        <ListItem
          leading={<Tile icon="wallet" />}
          title="Historial de pagos"
          subtitle="Membresías y pagos"
          chevron
          onClick={() => setModal('payments')}
        />
        <ListItem
          leading={<Tile icon="plus" />}
          title="Registrar pago"
          subtitle="Nuevo pago de membresía"
          chevron
          onClick={() => navigate(`/c/pago?alumno=${student.id}`)}
        />
      </List>
      {student.active ? (
        <Button
          variant="danger"
          className={styles.account}
          onClick={() => setConfirming(true)}
        >
          Cerrar cuenta del alumno
        </Button>
      ) : (
        <Button
          variant="sec"
          className={styles.account}
          loading={setActive.isPending}
          onClick={reactivateAccount}
        >
          Reactivar cuenta
        </Button>
      )}

      <StudentRmsModal
        studentId={student.id}
        studentName={name}
        open={modal === 'rms'}
        onClose={() => setModal(null)}
      />
      <StudentPaymentsModal
        studentId={student.id}
        open={modal === 'payments'}
        onClose={() => setModal(null)}
      />
      <ConfirmDialog
        open={confirming}
        destructive
        title="Cerrar cuenta"
        message={
          <>
            <b>{name}</b> va a dejar de tener acceso a la app. Es una baja
            lógica: sus datos y sus pagos se conservan y podés reactivar la
            cuenta cuando quieras.
          </>
        }
        confirmLabel="Cerrar cuenta"
        loading={setActive.isPending}
        onConfirm={closeAccount}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
