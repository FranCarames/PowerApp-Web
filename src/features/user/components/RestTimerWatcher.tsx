import { useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/shared/ui';

import { clearRestTimer, onRestTimerDone } from '../restTimerStore';

/** Tres pulsos cortos, que se sienten en el bolsillo (milisegundos de vibración y de pausa, alternados). */
const VIBRATION_PATTERN = [300, 150, 300, 150, 300];

/**
 * Lo que el temporizador de descanso tiene que hacer sin importar en qué pantalla esté el alumno
 * (CU-U-14, paso 3): al llegar a cero, avisa con un toast y hace vibrar el dispositivo si puede, y al
 * cerrarse la sesión deja el temporizador como nuevo. No dibuja nada; va una sola vez, en los providers.
 */
export function RestTimerWatcher() {
  const toast = useToast();
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(
    () =>
      onRestTimerDone(() => {
        toast.success('Descanso terminado');
        // No todos los dispositivos vibran (iPhone y la mayoría de las compus no): se prueba antes.
        if ('vibrate' in navigator) navigator.vibrate(VIBRATION_PATTERN);
      }),
    [toast],
  );

  useEffect(() => {
    if (userId === undefined) clearRestTimer();
  }, [userId]);

  return null;
}
