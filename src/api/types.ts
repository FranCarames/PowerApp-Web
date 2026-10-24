import type { components } from './schema';

// Alias cortos de los tipos generados en schema.d.ts. Los tipos de la API no se escriben a mano.
type Schemas = components['schemas'];

export type User = Schemas['User'];
export type LoginResponse = Schemas['LoginResponseDto'];
export type PaginatedUsers = Schemas['PaginatedUsersResponseDto'];
export type Role = User['role'];
export type Membership = Schemas['Membership'];
export type MembershipPayment = Schemas['MembershipPayment'];
export type Coach = Schemas['Coach'];
export type MembershipStatusSummary = Schemas['MembershipStatusSummaryDto'];
export type Exercise = Schemas['Exercise'];
export type UserRm = Schemas['UserRmDetailDto'];
export type PotentialRmResponse = Schemas['PotentialRmResponseDto'];
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
/** Una asignación de planificación a un alumno (E-13, E-14 y el listado del alumno). */
export type UserPlanificationAssignment =
  Schemas['UserPlanificationResponseDto'];
export type AssignPlanificationBody = Schemas['AssignPlanificationToUserDto'];
/** El 409 de `POST /planification/user/assign` con las asignaciones que se pisan. */
export type AssignPlanificationOverlap =
  Schemas['AssignPlanificationOverlapResponseDto'];
export type SetUserPlanificationActiveBody =
  Schemas['SetUserPlanificationActiveDto'];
export type RoutineDetail = Schemas['RoutineDetailResponseDto'];
export type RoutineDetailCircuit = Schemas['RoutineDetailCircuitDto'];
/** Una semana del home: de lunes a domingo, con lo individual y lo del plan (B1). */
export type RoutineHomeWeek = Schemas['RoutineHomeWeekResponseDto'];
/** Una rutina individual asignada a un día, con su progreso. */
export type RoutineAssignedListItem =
  Schemas['RoutineAssignedListItemResponseDto'];
/** Las rutinas de una asignación de plan en una semana del plan. */
export type RoutineAssignedPlanWeek =
  Schemas['RoutineAssignedPlanWeekResponseDto'];
export type RoutineAssignedPlanRoutine =
  Schemas['RoutineAssignedPlanRoutineDto'];
export type RoutineAssignedProgress = Schemas['RoutineAssignedProgressDto'];
/** El detalle de una rutina individual asignada, con lo que el alumno hizo (B2). */
export type RoutineAssignedDetail = Schemas['RoutineAssignedDetailResponseDto'];
/** El detalle de una rutina de una asignación de plan (B2). */
export type RoutinePlanSessionDetail =
  Schemas['RoutinePlanSessionDetailResponseDto'];
/** El hecho de un ejercicio: el día, la nota y cuándo se registró (B3 y B4). */
export type RoutineAssignedFinished = Schemas['RoutineAssignedFinishedDto'];
export type MarkExerciseFinishedBody = Schemas['MarkExerciseFinishedDto'];
export type RoutineAssignedUnfinished =
  Schemas['RoutineAssignedUnfinishedResponseDto'];
export type AssignRoutineToUserBody = Schemas['AssignRoutineToUserDto'];
export type RoutineAssignUserResponse = Schemas['RoutineAssignUserResponseDto'];
/** Una sesión del historial que viene de una rutina individual (B6), con lo que el alumno hizo en ella. */
export type RoutineHistoryIndividualSession =
  Schemas['RoutineHistoryIndividualSessionDto'];
/** Una sesión del historial que viene de una rutina de un plan (BE-20d): la semana y la plantilla en lugar de `assignment_id`. */
export type RoutineHistoryPlanSession = Schemas['RoutineHistoryPlanSessionDto'];
/** Una sesión del historial de entrenamientos del alumno (B6): individual o de un plan, se distinguen por `source`. */
export type RoutineHistorySession =
  RoutineHistoryIndividualSession | RoutineHistoryPlanSession;
/** Un ejercicio que el alumno hizo en una sesión del historial: el día, su nota y la prescripción de sus series. */
export type RoutineHistoryExercise = Schemas['RoutineHistoryExerciseDto'];
/** Un bloque de series del historial: lo que prescribió el entrenador, no lo que levantó el alumno. */
export type RoutineHistorySet = Schemas['RoutineHistorySetDto'];
