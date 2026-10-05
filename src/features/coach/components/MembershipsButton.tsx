import { useNavigate } from 'react-router';

import { IconButton } from '@/shared/ui';

import { useMembershipSummary } from '../hooks/useMembershipSummary';

/**
 * El acceso al control de membresías, con un contador de los alumnos que piden atención: los que
 * tienen la membresía por vencer o vencida. Si el resumen no carga, el botón queda sin contador.
 */
export function MembershipsButton() {
  const navigate = useNavigate();
  const { data } = useMembershipSummary();
  const attention = data ? data.counts.expiring_soon + data.counts.expired : 0;

  return (
    <IconButton
      icon="wallet"
      label={
        attention > 0
          ? `Control de membresías: ${attention} ${attention === 1 ? 'requiere' : 'requieren'} atención`
          : 'Control de membresías'
      }
      badge={attention}
      onClick={() => navigate('/c/membresias')}
    />
  );
}
