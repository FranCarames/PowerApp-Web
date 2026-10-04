import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

import type { RegisterValues } from '../schemas';

/**
 * `POST /users/register`. Siempre manda `role: 'user'`: el alta de entrenadores y admins no pasa por
 * acá. La respuesta trae un token, pero CU-U-01 pide volver al login y no abrir sesión (V6 de
 * PLAN.md), así que no se lee ni se guarda.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (values: RegisterValues) =>
      api.post('/api/v1/users/register', { body: { ...values, role: 'user' } }),
  });
}
