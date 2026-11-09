import { useId, useState } from 'react';

import type { CircuitListItemPlus } from '@/api/types';
import { Button, Card, List, Pill, VisuallyHidden } from '@/shared/ui';

import { circuitSubtitle } from '../circuitTypes';
import { inRoutineLabel } from '../routineCircuits';
import { ROUTINE_CIRCUITS_MAX } from '../routineSchema';
import { CircuitLibrary } from './CircuitLibrary';
import styles from './RoutineCircuitLibrary.module.css';

interface RoutineCircuitLibraryProps {
  /** Cuántas veces está cada circuito en la rutina (lo escrito, no lo guardado). */
  usedCounts: ReadonlyMap<string, number>;
  /** La rutina ya tiene 50 circuitos. */
  full: boolean;
  /** La rutina está dada de baja: no se le agrega nada. */
  disabled: boolean;
  onAdd: (circuit: CircuitListItemPlus) => void;
}

/**
 * La «Biblioteca de circuitos» del editor de rutina en escritorio (desde 960 px, CU-E-16 y CU-E-17):
 * al costado del formulario, fija al bajar, con el mismo buscador y los mismos chips que «Agregar
 * circuitos». «Agregar» suma el circuito al final de la rutina al instante, sin guardar: el foco queda
 * en el botón y un lector de pantalla oye «<circuito> agregado al final de la rutina».
 */
export function RoutineCircuitLibrary({
  usedCounts,
  full,
  disabled,
  onAdd,
}: RoutineCircuitLibraryProps) {
  const titleId = useId();
  const [announcement, setAnnouncement] = useState('');

  function add(circuit: CircuitListItemPlus) {
    onAdd(circuit);
    const text = `${circuit.name} agregado al final de la rutina`;
    // Si se agrega el mismo dos veces seguidas, el texto cambia igual (un espacio duro al final) y se vuelve a anunciar.
    setAnnouncement((previous) => (previous === text ? `${text}\u00a0` : text));
  }

  return (
    <aside className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Biblioteca de circuitos
      </h2>
      <p className={styles.intro}>
        Sumá circuitos al final de la rutina. Uno puede ir más de una vez.
      </p>
      {full && (
        <p role="status" className={styles.full}>
          Llegaste al máximo de {ROUTINE_CIRCUITS_MAX} circuitos por rutina.
        </p>
      )}
      <CircuitLibrary skeletonRows={3}>
        {(visible) => (
          <List gap={8}>
            {visible.map((circuit) => {
              const used = usedCounts.get(circuit.id) ?? 0;
              return (
                <Card key={circuit.id} row className={styles.item}>
                  <div className={styles.text}>
                    <div className={styles.name}>{circuit.name}</div>
                    <div className={styles.sub}>{circuitSubtitle(circuit)}</div>
                    {used > 0 && (
                      <div className={styles.tag}>
                        <Pill tone="acc">{inRoutineLabel(used)}</Pill>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    sm
                    icon="plus"
                    aria-label={`Agregar ${circuit.name}`}
                    disabled={full || disabled}
                    onClick={() => add(circuit)}
                  >
                    Agregar
                  </Button>
                </Card>
              );
            })}
          </List>
        )}
      </CircuitLibrary>
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </aside>
  );
}
