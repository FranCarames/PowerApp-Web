import { useNavigate } from 'react-router';

import type { IconName } from '@/shared/icons';
import { List, ListItem, PageHeader, Tile } from '@/shared/ui';

interface MoreItem {
  to: string;
  icon: IconName;
  title: string;
  subtitle: string;
}

/** Lo que no entra en la tab bar del Admin. */
const ITEMS: MoreItem[] = [
  {
    to: '/a/planes',
    icon: 'calendar',
    title: 'Planificaciones',
    subtitle: 'Planes sistémicos',
  },
  {
    to: '/a/circuitos',
    icon: 'cycle',
    title: 'Circuitos',
    subtitle: 'Reutilizables entre rutinas',
  },
  {
    to: '/a/entrenadores',
    icon: 'shield',
    title: 'Entrenadores',
    subtitle: 'Edición y bajas',
  },
  {
    to: '/a/catalogo',
    icon: 'grid',
    title: 'Catálogo',
    subtitle: 'Músculos y grupos musculares',
  },
  {
    to: '/a/membresias',
    icon: 'wallet',
    title: 'Membresías',
    subtitle: 'Tipos, precios y duración',
  },
  {
    to: '/cuenta',
    icon: 'user',
    title: 'Mi cuenta',
    subtitle: 'Contraseña y sesión',
  },
];

/** Más secciones: en mobile, los accesos del Admin que no tienen lugar en la tab bar. */
export function MorePage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader eyebrow="Administración" title="Más secciones" />
      <List columns={2}>
        {ITEMS.map(({ to, icon, title, subtitle }) => (
          <ListItem
            key={to}
            leading={<Tile icon={icon} />}
            title={title}
            subtitle={subtitle}
            chevron
            onClick={() => navigate(to)}
          />
        ))}
      </List>
    </>
  );
}
