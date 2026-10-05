import type { components } from './schema';

// Alias cortos de los tipos generados en schema.d.ts. Los tipos de la API no se escriben a mano.
type Schemas = components['schemas'];

export type User = Schemas['User'];
export type PaginatedUsers = Schemas['PaginatedUsersResponseDto'];
export type Role = User['role'];
export type Membership = Schemas['Membership'];
export type MembershipPayment = Schemas['MembershipPayment'];
export type Coach = Schemas['Coach'];
export type UserPlanification = Schemas['UserPlanification'];
export type MembershipStatusSummary = Schemas['MembershipStatusSummaryDto'];
export type Exercise = Schemas['Exercise'];
export type Muscle = Schemas['Muscle'];
export type MuscleGroup = Schemas['MuscleGroup'];
export type CircuitListItem = Schemas['CircuitListItemResponseDto'];
export type RoutineListItem = Schemas['RoutineListItemResponseDto'];
export type PlanificationListItem = Schemas['PlanificationListItemResponseDto'];
