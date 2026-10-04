import type { components } from './schema';

// Alias cortos de los tipos generados en schema.d.ts. Los tipos de la API no se escriben a mano.
type Schemas = components['schemas'];

export type User = Schemas['User'];
export type Role = User['role'];
export type Membership = Schemas['Membership'];
export type Coach = Schemas['Coach'];
export type UserPlanification = Schemas['UserPlanification'];
