import { getErrorMessage } from '@/api/errors';
import type { User } from '@/api/types';
import { formatCuil } from '@/shared/lib/format';
import { DetailList, LinkButton, Skeleton } from '@/shared/ui';

import { useCoach } from '../hooks/useCoach';

/** Los datos de un entrenador en su detalle: el email profesional y el CUIL, que están en `Coach` y no en el usuario. */
export function CoachDetails({ user }: { user: User }) {
  const coach = useCoach(user.id);

  if (coach.isError) {
    return (
      <p role="alert">
        {getErrorMessage(coach.error)}{' '}
        <LinkButton
          onClick={() => void coach.refetch()}
          disabled={coach.isRefetching}
        >
          Reintentar
        </LinkButton>
      </p>
    );
  }

  const loading = coach.isPending;
  return (
    <DetailList
      items={[
        {
          label: 'Email profesional',
          value: loading ? (
            <Skeleton width={140} height={14} radius={6} />
          ) : (
            coach.data?.coach_email
          ),
        },
        {
          label: 'CUIL',
          value: loading ? (
            <Skeleton width={110} height={14} radius={6} />
          ) : (
            coach.data && formatCuil(coach.data.cuil)
          ),
        },
      ]}
    />
  );
}
