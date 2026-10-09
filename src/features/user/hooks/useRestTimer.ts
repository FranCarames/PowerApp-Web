import { useSyncExternalStore } from 'react';

import {
  getRestTimer,
  resetRestTimer,
  selectRestPreset,
  subscribeRestTimer,
  toggleRestTimer,
} from '../restTimerStore';

/**
 * El temporizador de descanso (CU-U-14): `total` y `left` en segundos y `status`, con las acciones
 * para elegir una duración (que arranca el conteo), iniciar o pausar y reiniciar. El estado no es de
 * la pantalla: sigue corriendo si el alumno se va a otra.
 */
export function useRestTimer() {
  const state = useSyncExternalStore(subscribeRestTimer, getRestTimer);
  return {
    ...state,
    select: selectRestPreset,
    toggle: toggleRestTimer,
    reset: resetRestTimer,
  };
}
