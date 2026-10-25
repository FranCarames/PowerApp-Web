import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { PlanificationDetail } from '@/api/types';
import { Button, ConfirmDialog, useToast } from '@/shared/ui';

import { useSetPlanificationActive } from '../hooks/useSetPlanificationActive';
import styles from './PlanStatusActions.module.css';

/**
 * Eliminar o reactivar una planificación (CU-E-11). Eliminar es una baja lógica y pide confirmación: el
 * plan deja de ofrecerse como plantilla para asignaciones nuevas, y los alumnos que ya lo tienen
 * asignado lo conservan, con su historial (el prototipo dice que "se quita de los alumnos", pero el
 * backend no cascadea nada). Ningún endpoint dice si el plan está en uso, así que el aviso es siempre el
 * mismo. Reactivar no pide confirmación.
 */
export function PlanStatusActions({
  plan,
  basePath,
}: {
  plan: PlanificationDetail;
  /** La ruta del listado de planificaciones del rol: a donde se vuelve al eliminar. */
  basePath: string;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const setActive = useSetPlanificationActive();
  const [confirming, setConfirming] = useState(false);

  function changeActive(active: boolean) {
    setActive.mutate(
      { id: plan.id, active },
      {
        onSuccess: () => {
          toast.success(
            active ? 'Planificación reactivada' : 'Planificación eliminada',
          );
          setConfirming(false);
          // Eliminarla la saca de la edición; reactivarla la deja editable en la misma pantalla.
          if (!active) navigate(basePath);
        },
        onError: (error) => {
          toast.error(
            getErrorMessage(error, {
              404: 'La planificación ya no existe. Volvé a la lista.',
            }),
          );
          setConfirming(false);
        },
      },
    );
  }

  return (
    <>
      {plan.active ? (
        <Button
          variant="danger"
          className={styles.action}
          onClick={() => setConfirming(true)}
        >
          Eliminar planificación
        </Button>
      ) : (
        <Button
          variant="ghost"
          className={styles.action}
          loading={setActive.isPending}
          onClick={() => changeActive(true)}
        >
          Reactivar planificación
        </Button>
      )}
      <ConfirmDialog
        open={confirming}
        destructive
        title="Eliminar planificación"
        message={
          <>
            <b>{plan.name || 'Esta planificación'}</b> deja de ofrecerse como
            plantilla para asignaciones nuevas. No se quita a los alumnos que ya
            la tienen asignada ni se pierde su historial. Es una baja lógica: la
            podés reactivar cuando quieras.
          </>
        }
        confirmLabel="Eliminar"
        loading={setActive.isPending}
        onConfirm={() => changeActive(false)}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
