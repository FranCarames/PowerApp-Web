import type { Membership } from '@/api/types';

// Cuatro tipos de membresía, uno de ellos dado de baja. La cantidad y los precios se apartan a
// propósito de los del prototipo (lo que suele traer un backend de prueba): así se ve de un vistazo
// si respondió el mock o el backend.
export const memberships: Membership[] = [
  {
    id: '35a1b462-050e-4186-8404-fe1a59863e05',
    name: 'Plan Mensual',
    duration: 30,
    price: 19500,
    active: true,
    created_at: '2026-03-02T15:20:41.318Z',
    updated_at: '2026-03-02T15:20:41.318Z',
  },
  {
    id: 'a1edca0c-f4b7-4990-8691-c1fbdf401ff7',
    name: 'Plan Trimestral',
    duration: 90,
    price: 52500,
    active: true,
    created_at: '2026-03-02T15:22:09.774Z',
    updated_at: '2026-03-02T15:22:09.774Z',
  },
  {
    id: 'c8c5cb68-24e1-4fb4-88e7-2fb766218af3',
    name: 'Plan Semestral',
    duration: 180,
    price: 96000,
    active: false,
    created_at: '2026-03-02T15:23:30.052Z',
    updated_at: '2026-08-14T12:05:17.640Z',
  },
  {
    id: '339c4808-851e-4585-8303-075625924167',
    name: 'Plan Anual',
    duration: 365,
    price: 175000,
    active: true,
    created_at: '2026-03-02T15:24:58.931Z',
    updated_at: '2026-03-02T15:24:58.931Z',
  },
];
