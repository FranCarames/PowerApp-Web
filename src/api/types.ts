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
export type CircuitListItemPlus = Schemas['CircuitListItemPlusResponseDto'];
export type CircuitDetailResponse = Schemas['CircuitDetailResponseDto'];
export type CircuitExerciseResponse = Schemas['CircuitExerciseResponseDto'];
export type CircuitSetResponse = Schemas['CircuitSetResponseDto'];
export type CreateCircuitBody = Schemas['CreateCircuitDto'];
export type CreateCircuitSetBody = Schemas['CreateCircuitSetDto'];
export type RoutineListItem = Schemas['RoutineListItemResponseDto'];
export type RoutineListItemPlus = Schemas['RoutineListItemPlusResponseDto'];
export type PlanificationListItem = Schemas['PlanificationListItemResponseDto'];
