import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { getErrorMessage, isApiError } from '@/api/errors';
import type { CircuitListItemPlus } from '@/api/types';
import {
  Button,
  ErrorState,
  List,
  ListSkeleton,
  PageHeader,
} from '@/shared/ui';

import { useRoutine } from '../hooks/useRoutines';
import { circuitCounts } from '../routineCircuits';
import {
  cameFromRoutineEditor,
  NEW_ROUTINE_KEY,
  peekRoutineStash,
  queueRoutineOp,
  RESTORE_DRAFT_STATE,
} from '../routineDraft';
import {
  applyRoutineOps,
  ROUTINE_CIRCUITS_MAX,
  routineDefaultValues,
} from '../routineSchema';
import { CircuitLibrary } from './CircuitLibrary';
import { CircuitPickCard } from './CircuitPickCard';
import styles from './RoutineAddCircuits.module.css';

interface RoutineAddCircuitsProps {
  /** El id de la rutina de la ruta, o `nuevo`. */
  id: string;
  /** La ruta de las rutinas del rol (`/a/rutinas` o `/c/rutinas`): el editor es `<basePath>/<id>`. */
  basePath: string;
}

/**
 * «Agregar circuitos» (CU-E-16 y CU-E-17, pasos 2 y 3), la misma pantalla del Admin y del Entrenador:
 * en el celular y la tablet reemplaza al modal de antes (en escritorio se agrega desde la biblioteca del
 * editor, aunque esta pantalla también funciona). Se eligen varios circuitos a la vez y se suman al final
 * de la rutina en el orden en que se tocaron, hasta el tope de 50. No guarda nada: deja pendiente lo
 * elegido (`queueRoutineOp`) y vuelve al editor, que lo suma a lo escrito; falta «Guardar rutina».
 *
 * Lo escrito en la rutina llega en el borrador (`stashRoutineDraft`, que deja el editor antes de venir):
 * da el nombre de arriba y las marcas «En la rutina». Si se recargó, el borrador se perdió y se usa la
 * rutina guardada. Cancelar, volver y «atrás» vuelven al editor sin cambios.
 */
export function RoutineAddCircuits({ id, basePath }: RoutineAddCircuitsProps) {
  const navigate = useNavigate();
  const fromEditor = cameFromRoutineEditor(useLocation().state);
  const isNew = id === NEW_ROUTINE_KEY;
  const editorPath = `${basePath}/${id}`;

  // Se lee una sola vez: el editor lo dejó al salir y lo vuelve a leer al volver.
  const [stash] = useState(() => peekRoutineStash(id));
  const draftName = stash?.values?.name.trim() ?? '';
  // La rutina guardada hace falta si no hay borrador (para lo que ya tiene) o si el nombre escrito está vacío.
  const needsSaved = !isNew && (!stash?.values || draftName === '');
  const routine = useRoutine(needsSaved ? id : null);
  const name = draftName || routine.data?.name || 'Rutina nueva';

  // Los circuitos que la rutina ya tiene: los escritos o, sin borrador, los guardados (y en las dos, lo pendiente).
  const base =
    stash?.values ??
    (isNew
      ? routineDefaultValues()
      : routine.data && routineDefaultValues(routine.data));
  const current = base && applyRoutineOps(base, stash?.ops ?? []).circuits;
  const counts = current && circuitCounts(current);
  const free = current ? Math.max(0, ROUTINE_CIRCUITS_MAX - current.length) : 0;

  const [picked, setPicked] = useState<string[]>([]);
  const full = picked.length >= free;
  const notFound =
    isApiError(routine.error) &&
    (routine.error.status === 404 || routine.error.status === 400);

  /** Al editor: «atrás» si se vino de él (así «atrás» desde la rutina no vuelve acá) o, si no, reemplazando esta pantalla. */
  function leave() {
    if (fromEditor) navigate(-1);
    else navigate(editorPath, { replace: true, state: RESTORE_DRAFT_STATE });
  }

  function toggle({ id: circuitId }: CircuitListItemPlus) {
    setPicked((list) =>
      list.includes(circuitId)
        ? list.filter((other) => other !== circuitId)
        : list.length < free
          ? [...list, circuitId]
          : list,
    );
  }

  function add() {
    if (picked.length === 0) return;
    for (const circuitId of picked) {
      queueRoutineOp(id, { type: 'append', circuitId });
    }
    leave();
  }

  const hint = !current
    ? ''
    : free === 0
      ? `Llegaste al máximo de ${ROUTINE_CIRCUITS_MAX} circuitos por rutina.`
      : full
        ? `Con estos, la rutina llega al máximo de ${ROUTINE_CIRCUITS_MAX} circuitos. Para elegir otro, desmarcá alguno.`
        : '';
  const count = picked.length;

  return (
    <>
      <PageHeader
        eyebrow={name}
        title="Agregar circuitos"
        back={editorPath}
        backState={RESTORE_DRAFT_STATE}
        backLabel={name}
        onBack={(event) => {
          event.preventDefault();
          leave();
        }}
      />
      <div className={styles.narrow}>
        <p className={styles.intro}>
          Elegí los que quieras. Se suman al final de la rutina en el orden en
          que los tocaste.
        </p>
        <div className={styles.list}>
          {counts ? (
            <CircuitLibrary>
              {(visible) => (
                <List gap={8}>
                  {visible.map((circuit) => (
                    <CircuitPickCard
                      key={circuit.id}
                      circuit={circuit}
                      position={picked.indexOf(circuit.id) + 1}
                      inRoutine={counts.get(circuit.id) ?? 0}
                      blocked={full}
                      onToggle={toggle}
                    />
                  ))}
                </List>
              )}
            </CircuitLibrary>
          ) : routine.isError ? (
            <ErrorState
              title={notFound ? 'No encontramos la rutina' : undefined}
              message={
                notFound
                  ? 'No hay ninguna rutina con ese enlace. Volvé a la lista.'
                  : getErrorMessage(routine.error)
              }
              // Un 404 o un 400 se repetirían igual: no se ofrece reintentar.
              onRetry={notFound ? undefined : () => void routine.refetch()}
              retrying={routine.isRefetching}
            />
          ) : (
            <ListSkeleton rows={4} />
          )}
        </div>
      </div>
      <div className={styles.bar}>
        <div className={styles.barInner}>
          <p role="status" className={styles.hint}>
            {hint}
          </p>
          <div className={styles.buttons}>
            <Button variant="ghost" onClick={leave}>
              Cancelar
            </Button>
            <Button disabled={count === 0} onClick={add}>
              {count === 0
                ? 'Elegí uno o más'
                : `Agregar ${count} circuito${count === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
