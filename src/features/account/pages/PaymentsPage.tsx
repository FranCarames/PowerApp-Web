import { useMemo } from 'react';

import type { MembershipPayment } from '@/api/types';
import { getErrorMessage } from '@/api/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatDate } from '@/shared/lib/dates';
import { formatPrice } from '@/shared/lib/format';
import {
  latestPayment,
  membershipStatusOf,
  newestPaymentsFirst,
} from '@/shared/lib/membershipStatus';
import {
  EmptyState,
  ErrorState,
  List,
  ListItem,
  ListSkeleton,
  PageHeader,
  SectionHeader,
  Skeleton,
  Tile,
} from '@/shared/ui';

import { MembershipCard } from '../components/MembershipCard';
import { useUserPayments } from '../hooks/useUserPayments';
import styles from './PaymentsPage.module.css';

/** Historial de pagos (CU-U-07): la membresía actual y todos los pagos del alumno. */
export function PaymentsPage() {
  const { user } = useAuth();
  // La ruta pide sesión y rol Usuario, así que siempre hay usuario.
  if (!user) return null;
  return <Payments userId={user.id} />;
}

function Payments({ userId }: { userId: string }) {
  const query = useUserPayments(userId);
  const payments = useMemo(
    () => (query.data ? newestPaymentsFirst(query.data) : []),
    [query.data],
  );

  return (
    <>
      <PageHeader
        eyebrow="Mi cuenta"
        title="Historial de pagos"
        back="/cuenta"
      />
      {query.isPending ? (
        <div aria-busy="true">
          <Skeleton height={68} radius={16} />
          <ListSkeleton columns={2} rows={4} />
        </div>
      ) : query.isError ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      ) : payments.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="Todavía no tenés pagos"
          message="Cuando tu entrenador registre un pago, lo vas a ver acá."
        />
      ) : (
        <PaymentsContent payments={payments} />
      )}
    </>
  );
}

function PaymentsContent({ payments }: { payments: MembershipPayment[] }) {
  // El pago que manda no es el más reciente por fecha, sino el de vencimiento más lejano.
  const current = latestPayment(payments);
  const status = membershipStatusOf(current);

  return (
    <>
      {current && status !== 'no_payments' && (
        <MembershipCard payment={current} status={status} />
      )}
      <SectionHeader title="Todos los pagos" />
      <List columns={2}>
        {payments.map((payment) => (
          <ListItem
            key={payment.id}
            leading={<Tile icon="check" tone="ok" />}
            title={payment.name}
            subtitle={
              <>
                <span className={styles.line}>
                  Pagado el {formatDate(payment.created_at)}
                </span>
                <span className={styles.line}>
                  Vence el {formatDate(payment.expired_at)}
                </span>
              </>
            }
            trailing={
              <span className={styles.price}>{formatPrice(payment.price)}</span>
            }
          />
        ))}
      </List>
    </>
  );
}
