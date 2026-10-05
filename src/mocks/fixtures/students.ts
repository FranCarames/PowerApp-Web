import type { User } from '@/api/types';
import type { MembershipStatus } from '@/shared/lib/membershipStatus';

import { demoAccounts } from './users';

// Los alumnos que ve el entrenador de demo en Mis alumnos: 29, para que el listado tenga dos páginas
// (el backend trae 20 por página). Son los 3 alumnos de las cuentas de demo (así su login y su fila
// son la misma persona) más los del prototipo (Lucía Méndez, Tomás Ríos...) y otros del mismo estilo.
// Entre ellos hay 5 con la cuenta inactiva.

const DAY = 24 * 60 * 60 * 1000;

/** "Lucía Méndez" → "lucia.mendez@email.com": sin tildes, como un email de verdad. */
function emailOf(first: string, last: string): string {
  const plain = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return `${plain(first)}.${plain(last)}@email.com`;
}

function student(
  index: number,
  first_name: string,
  last_name: string,
  active = true,
): User {
  // Los de la lista más nuevos tienen un índice menor: el backend los ordena por `created_at` descendente.
  const created = new Date(Date.now() - (index + 1) * 9 * DAY).toISOString();
  return {
    id: `demo-student-${String(index + 1).padStart(2, '0')}`,
    first_name,
    last_name,
    email: emailOf(first_name, last_name),
    email_verified: true,
    role: 'user',
    phone_verified: false,
    active,
    created_at: created,
    updated_at: created,
  };
}

const NAMES: Array<[string, string, boolean?]> = [
  ['Lucía', 'Méndez'],
  ['Tomás', 'Ríos'],
  ['Sofía', 'Paz'],
  ['Martín', 'Soto'],
  ['Julián', 'Vega'],
  ['Valeria', 'Pérez', false],
  ['Camila', 'Acosta'],
  ['Matías', 'Benítez'],
  ['Agustina', 'Castro'],
  ['Nicolás', 'Domínguez'],
  ['Florencia', 'Esquivel'],
  ['Facundo', 'Figueroa', false],
  ['Micaela', 'Giménez'],
  ['Joaquín', 'Herrera'],
  ['Belén', 'Ibarra'],
  ['Santiago', 'Juárez'],
  ['Carolina', 'Luna'],
  ['Lautaro', 'Medina', false],
  ['Romina', 'Navarro'],
  ['Federico', 'Ojeda'],
  ['Paula', 'Quiroga'],
  ['Bruno', 'Rojas'],
  ['Daniela', 'Sosa'],
  ['Ezequiel', 'Torres'],
  ['Natalia', 'Vargas', false],
  ['Gonzalo', 'Yáñez'],
];

// Los alumnos de las cuentas de demo conservan su id y sus datos, y son los más antiguos.
const demoStudents = demoAccounts
  .filter(({ user }) => user.role === 'user')
  .map(({ user }) => user);

/** Del más nuevo al más viejo, como los devuelve `GET /users/all`. */
export const students: User[] = [
  ...NAMES.map(([first, last, active], index) =>
    student(index, first, last, active),
  ),
  ...demoStudents,
];

// El estado de membresía de cada alumno de demo, por su posición en `students`. Franco (26) tiene la
// membresía activa, Lucía Gómez (27) por vencer y Martín Pérez (28) nunca pagó, como en sus pagos
// (`payments.ts`). Los demás se reparten para que el resumen tenga 4 por vencer, 5 vencidos y 3 sin
// pagos.
const EXPIRING_SOON_AT = [3, 8, 14, 27];
const EXPIRED_AT = [2, 6, 11, 17, 25];
const NO_PAYMENTS_AT = [5, 13, 28];

/** El estado de membresía de un alumno de demo, o `undefined` si el id no es de ninguno. */
export function studentMembershipStatus(
  id: string,
): MembershipStatus | undefined {
  const index = students.findIndex((student) => student.id === id);
  if (index < 0) return undefined;
  if (EXPIRING_SOON_AT.includes(index)) return 'expiring_soon';
  if (EXPIRED_AT.includes(index)) return 'expired';
  if (NO_PAYMENTS_AT.includes(index)) return 'no_payments';
  return 'active';
}
