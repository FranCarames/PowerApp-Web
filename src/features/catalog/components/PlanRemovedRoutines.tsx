import { useId, useState } from 'react';

import type { PlanificationAsignation } from '@/api/types';
import {
  Button,
  List,
  ListItem,
  SectionHeader,
  Switch,
  Tile,
} from '@/shared/ui';

import styles from './PlanRemovedRoutines.module.css';

interface PlanRemovedRoutinesProps {
  /** Los vínculos quitados del plan (`active: false`), en el orden del detalle. Con ninguno, el padre no lo monta. */
  removed: readonly PlanificationAsignation[];
  /** El plan está dado de baja: se ven, pero no se reincorporan (el backend lo rechaza). */
  disabled: boolean;
  onReincorporate: (link: PlanificationAsignation) => void;
  onReincorporateAll: () => void;
}

/**
 * Las rutinas quitadas del plan, aparte de las vigentes y siempre a mano (CU-E-12c y CU-E-12d): el
 * interruptor «Mostrar quitadas (N)», con N la cantidad de quitadas, y, prendido, la sección «Quitadas del
 * plan» con una fila por vínculo («Semana N · Posición M» y «Reincorporar») y «Reincorporar todas a su
 * lugar» si hay más de una. Las quitadas salen de la respuesta del detalle (`active: false`), así que siguen
 * ahí después de salir del plan y volver a abrirlo.
 *
 * El interruptor arranca apagado y su estado es de este componente: no va a la dirección ni se guarda. El
 * padre lo monta solo mientras hay quitadas, así que al quedar en 0 desaparece y la próxima vez que
 * aparece arranca apagado de nuevo. Con el plan dado de baja anda (es solo ver) y los botones de
 * reincorporar quedan apagados.
 */
export function PlanRemovedRoutines({
  removed,
  disabled,
  onReincorporate,
  onReincorporateAll,
}: PlanRemovedRoutinesProps) {
  const sectionId = useId();
  const [shown, setShown] = useState(false);
  const label = `Mostrar quitadas (${removed.length})`;

  return (
    <>
      <div className={styles.switchRow}>
        {/* El interruptor ya se anuncia con este nombre: el texto es para la vista. */}
        <span aria-hidden="true">{label}</span>
        <Switch
          checked={shown}
          onChange={setShown}
          label={label}
          aria-controls={shown ? sectionId : undefined}
        />
      </div>
      {shown && (
        <section
          id={sectionId}
          aria-label="Quitadas del plan"
          className={styles.removed}
        >
          <SectionHeader
            level={4}
            title="Quitadas del plan"
            aside={removed.length}
          />
          <p className={styles.hint}>
            Volvés a ponerlas desde acá, a su lugar o a otro.
          </p>
          <List gap={8}>
            {removed.map((link) => (
              <ListItem
                key={link.id}
                leading={<Tile icon="list" tone="mut" />}
                title={link.routine.name}
                subtitle={`Semana ${link.week} · Posición ${link.order}`}
                trailing={
                  <Button
                    variant="ghost"
                    sm
                    disabled={disabled}
                    aria-label={`Reincorporar ${link.routine.name}`}
                    onClick={() => onReincorporate(link)}
                  >
                    Reincorporar
                  </Button>
                }
              />
            ))}
          </List>
          {removed.length > 1 && (
            <Button
              variant="ghost"
              className={styles.all}
              disabled={disabled}
              onClick={onReincorporateAll}
            >
              Reincorporar todas a su lugar
            </Button>
          )}
        </section>
      )}
    </>
  );
}
