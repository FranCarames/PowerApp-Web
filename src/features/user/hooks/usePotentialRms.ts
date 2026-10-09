import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

import type { PotentialRmValues } from '../schemas';

/**
 * `POST /user_rm/potential` (CU-U-16): estima el 1RM con la fórmula de Epley a partir de un peso y
 * las repeticiones logradas, y arma la tabla de 1RM a 12RM. Es un cálculo: no guarda nada. Se pide
 * como una query (mismo ejercicio, peso y repeticiones, mismo resultado, que no caduca) y, mientras
 * se calcula otra cosa, queda a la vista el resultado anterior. Con `input` en `null` no pide nada.
 */
export function usePotentialRms(input: PotentialRmValues | null) {
  return useQuery({
    queryKey: queryKeys.rmPotential.calc(input),
    queryFn: ({ signal }) => {
      if (!input) throw new Error('Faltan datos para calcular el RM');
      return api.post('/api/v1/user_rm/potential', { body: input, signal });
    },
    enabled: input !== null,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
}
