import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { getErrorMessage } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import type { RoutineAssignedFinished } from '@/api/types';
import { useToast } from '@/shared/ui';

import {
  assignmentDetailKey,
  assignmentKey,
  type RoutineAssignment,
} from '../routineDetail';

/** Lo que las dos respuestas del detalle (la individual y la del plan) tienen en común. */
interface DetailWithFinished {
  finished: RoutineAssignedFinished[];
}

/** Qué se manda al marcar un ejercicio (`MarkExerciseFinishedDto`, con los nombres de la interfaz). */
export interface MarkExerciseInput {
  routineExerciseId: string;
  /** El día en que lo hizo (`YYYY-MM-DD`). Obligatorio al marcar un ejercicio que no estaba marcado. */
  finishedAt: string;
  /**
   * Su nota: omitirla no la toca y la cadena vacía la borra. Hasta 100 caracteres. Se guarda en la misma
   * operación que la marca, así que anotar un ejercicio sin marcar lo marca.
   */
  userNote?: string;
}

/** Lo que `onMutate` guarda para poder revertir. */
interface RollbackContext {
  previous: DetailWithFinished | undefined;
}

/**
 * El detalle con lo hecho de un ejercicio cambiado: lo reemplaza por `entry` o, sin ella, lo saca.
 * Sirve para las dos respuestas del detalle.
 */
function withFinished<T extends DetailWithFinished>(
  detail: T,
  routineExerciseId: string,
  entry?: RoutineAssignedFinished,
): T {
  const others = detail.finished.filter(
    (item) => item.routine_exercise_id !== routineExerciseId,
  );
  return { ...detail, finished: entry ? [...others, entry] : others };
}

/**
 * Lo que el backend va a responder, para dibujarlo antes de que llegue: el día que se indicó, la nota
 * nueva (la cadena vacía la borra, omitirla deja la que había) y las fechas del registro.
 */
function optimisticEntry(
  input: MarkExerciseInput,
  previous: RoutineAssignedFinished | undefined,
): RoutineAssignedFinished {
  const now = new Date().toISOString();
  let note = previous?.user_note ?? null;
  if (input.userNote !== undefined) note = input.userNote || null;
  return {
    routine_exercise_id: input.routineExerciseId,
    finished_at: input.finishedAt,
    user_note: note,
    created_at: previous?.created_at ?? now,
    updated_at: now,
  };
}

/**
 * `POST /routine/assign-user/{id}/finished`: marca un ejercicio de una rutina individual como hecho. Es
 * idempotente: si ya estaba marcado responde 200 y corrige el día o la nota si cambiaron.
 *
 * Es el punto donde la vía del plan se va a sumar: su par (`/routine/assign-plan/{up}/{ra}/finished`,
 * BE-20c) no está en el backend publicado, así que por ahora solo se marcan las rutinas individuales.
 */
function postFinished(assignment: RoutineAssignment, input: MarkExerciseInput) {
  if (assignment.kind !== 'individual') {
    return Promise.reject(
      new Error('Marcar dentro de un plan todavía no está en el backend'),
    );
  }
  return api.post('/api/v1/routine/assign-user/{id}/finished', {
    params: { id: assignment.assignmentId },
    body: {
      routine_exercise_id: input.routineExerciseId,
      finished_at: input.finishedAt,
      user_note: input.userNote,
    },
  });
}

/** `DELETE /routine/assign-user/{id}/finished/{routineExerciseId}`: desmarca el ejercicio y borra su nota. Idempotente. */
function deleteFinished(
  assignment: RoutineAssignment,
  routineExerciseId: string,
) {
  if (assignment.kind !== 'individual') {
    return Promise.reject(
      new Error('Desmarcar dentro de un plan todavía no está en el backend'),
    );
  }
  return api.delete(
    '/api/v1/routine/assign-user/{id}/finished/{routineExerciseId}',
    { params: { id: assignment.assignmentId, routineExerciseId } },
  );
}

/**
 * Lo común de marcar y desmarcar: las dos cambian el detalle de la asignación con una actualización
 * optimista (el ejercicio cambia de estado al instante), la revierten si el servidor falla y avisan con
 * un toast, y al terminar piden de nuevo el detalle y el home, que muestran el progreso. Las mutaciones
 * de una misma asignación se hacen de a una, en el orden en que se pidieron.
 */
function useFinishedMutation<Input extends { routineExerciseId: string }>(
  assignment: RoutineAssignment,
  options: {
    send: (input: Input) => Promise<unknown>;
    /** El detalle como queda después de la mutación, antes de que el servidor responda. */
    apply: (detail: DetailWithFinished, input: Input) => DetailWithFinished;
    errors: Parameters<typeof getErrorMessage>[1];
  },
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const detailKey = assignmentDetailKey(assignment);

  return useMutation<unknown, Error, Input, RollbackContext>({
    scope: { id: `routine-finished:${assignmentKey(assignment)}` },
    mutationFn: options.send,
    onMutate: async (input) => {
      // Una consulta en vuelo pisaría el cambio optimista con datos de antes.
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<DetailWithFinished>(detailKey);
      if (previous) {
        queryClient.setQueryData(detailKey, options.apply(previous, input));
      }
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
      toast.error(getErrorMessage(error, options.errors));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineDetail.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.routineHome.all,
      });
    },
  });
}

/**
 * Marca un ejercicio de la rutina como hecho (CU-U-12), con el día en que lo hizo y, si quiere, su nota
 * (CU-U-13). También corrige el día o la nota de uno ya marcado.
 */
export function useMarkExercise(assignment: RoutineAssignment) {
  return useFinishedMutation<MarkExerciseInput>(assignment, {
    send: (input) => postFinished(assignment, input),
    apply: (detail, input) =>
      withFinished(
        detail,
        input.routineExerciseId,
        optimisticEntry(
          input,
          detail.finished.find(
            (item) => item.routine_exercise_id === input.routineExerciseId,
          ),
        ),
      ),
    errors: {
      400: 'No pudimos guardarlo. Puede que tu entrenador haya cambiado la rutina: actualizamos la pantalla.',
      403: 'Esta rutina no es tuya.',
      404: 'No encontramos la rutina. Puede que tu entrenador la haya cambiado.',
    },
  });
}

/** Desmarca un ejercicio de la rutina (CU-U-12): borra el registro y, con él, la nota. */
export function useUnmarkExercise(assignment: RoutineAssignment) {
  return useFinishedMutation<{ routineExerciseId: string }>(assignment, {
    send: ({ routineExerciseId }) =>
      deleteFinished(assignment, routineExerciseId),
    apply: (detail, { routineExerciseId }) =>
      withFinished(detail, routineExerciseId),
    errors: {
      400: 'No pudimos desmarcarlo. Actualizamos la pantalla.',
      403: 'Esta rutina no es tuya.',
      404: 'No encontramos la rutina. Puede que tu entrenador la haya cambiado.',
    },
  });
}
