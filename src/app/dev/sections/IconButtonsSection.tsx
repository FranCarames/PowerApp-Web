import { IconButton, LinkButton, useToast } from '@/shared/ui';

import { GalleryDemo } from '../GalleryDemo';
import { GallerySection } from '../GallerySection';
import styles from './IconButtonsSection.module.css';

export function IconButtonsSection() {
  const toast = useToast();

  return (
    <GallerySection
      id="botones-icono"
      title="Botones de ícono y enlaces"
      description="IconButton exige un label porque no tiene texto. LinkButton es la acción en forma de texto."
    >
      <GalleryDemo label="IconButton con borde (barra superior)">
        <IconButton icon="book" label="Biblioteca de ejercicios" />
        <IconButton
          icon="wallet"
          label="Control de membresías: 3 requieren atención"
          badge={3}
          onClick={() => toast.success('Abriste las membresías')}
        />
        <IconButton icon="wallet" label="Sin contador" badge={0} />
        <IconButton icon="plus" label="Deshabilitado" disabled />
      </GalleryDemo>

      <GalleryDemo label="Con borde, tamaño sm (selector de semana)">
        <IconButton icon="chevL" label="Semana anterior" size="sm" disabled />
        <IconButton icon="chev" label="Semana siguiente" size="sm" />
      </GalleryDemo>

      <GalleryDemo label="Sin borde (acciones de una fila)">
        <IconButton
          icon="edit"
          label="Editar RM de Press de banca"
          variant="ghost"
        />
        <IconButton
          icon="trash"
          label="Eliminar RM de Press de banca"
          variant="ghost"
          danger
        />
        <IconButton icon="x" label="Quitar Dominadas" variant="ghost" danger />
        <IconButton
          icon="edit"
          label="Deshabilitado"
          variant="ghost"
          disabled
        />
      </GalleryDemo>

      <GalleryDemo label="LinkButton" layout="stack">
        <div className={styles.right}>
          <LinkButton>¿Olvidaste tu contraseña?</LinkButton>
        </div>
        <div>
          <LinkButton tone="danger">Quitar circuito</LinkButton>
        </div>
        <div>
          <LinkButton disabled>Deshabilitado</LinkButton>
        </div>
      </GalleryDemo>
    </GallerySection>
  );
}
