import { useNavigate } from 'react-router';

import type { IconName } from '@/shared/icons';
import {
  Columns,
  LinkButton,
  List,
  ListItem,
  Note,
  PageHeader,
  SectionHeader,
  Tile,
} from '@/shared/ui';

import { DashboardCounter } from '../components/DashboardCounter';
import { useDashboardCounts } from '../hooks/useDashboardCounts';
import styles from './DashboardPage.module.css';

interface ManagementItem {
  to: string;
  icon: IconName;
  title: string;
  subtitle: string;
}

/** "12 activos": el número con su palabra en singular o plural. */
function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Panel del Admin: cuántos hay de lo principal, con un acceso a cada sección, y los accesos de gestión. */
export function DashboardPage() {
  const navigate = useNavigate();
  const counts = useDashboardCounts();

  // El dato de apoyo es un extra: si no llegó, queda el texto de la sección.
  const planCount = counts.plans.data;
  const coachCount = counts.coaches.data;
  const management: ManagementItem[] = [
    {
      to: '/a/planes',
      icon: 'calendar',
      title: 'Planificaciones',
      subtitle:
        planCount === undefined
          ? 'Planes sistémicos'
          : plural(planCount, 'plan sistémico', 'planes sistémicos'),
    },
    {
      to: '/a/entrenadores',
      icon: 'shield',
      title: 'Entrenadores',
      subtitle:
        coachCount === undefined
          ? 'Edición y bajas'
          : plural(coachCount, 'activo', 'activos'),
    },
    {
      to: '/a/catalogo?seccion=musculos',
      icon: 'grid',
      title: 'Músculos',
      subtitle: 'Asignados a ejercicios',
    },
    {
      to: '/a/catalogo?seccion=grupos',
      icon: 'list',
      title: 'Grupos musculares',
      subtitle: 'Agrupan músculos',
    },
    {
      to: '/a/membresias',
      icon: 'wallet',
      title: 'Membresías',
      subtitle: 'Tipos, precios y duración',
    },
  ];

  return (
    <>
      <PageHeader eyebrow="Panel" title="Administración" />
      {counts.hasError && (
        <Note tone="warn" icon="alert" role="alert" className={styles.note}>
          No pudimos cargar algunos números.{' '}
          <LinkButton onClick={counts.retry} disabled={counts.retrying}>
            {counts.retrying ? 'Reintentando…' : 'Reintentar'}
          </LinkButton>
        </Note>
      )}
      <Columns className={styles.counters}>
        <DashboardCounter
          to="/a/usuarios"
          icon="users"
          tone="pri"
          label="Usuarios"
          value={counts.users.data}
          pending={counts.users.isPending}
        />
        <DashboardCounter
          to="/a/ejercicios"
          icon="dumbbell"
          tone="acc"
          label="Ejercicios"
          value={counts.exercises.data}
          pending={counts.exercises.isPending}
        />
        <DashboardCounter
          to="/a/circuitos"
          icon="cycle"
          tone="ok"
          label="Circuitos activos"
          value={counts.circuits.data}
          pending={counts.circuits.isPending}
        />
        <DashboardCounter
          to="/a/rutinas"
          icon="list"
          tone="warn"
          label="Rutinas"
          value={counts.routines.data}
          pending={counts.routines.isPending}
        />
      </Columns>
      <SectionHeader title="Gestión" />
      <List columns={2}>
        {management.map(({ to, icon, title, subtitle }) => (
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
