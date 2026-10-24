import { z } from 'zod';

import { isCalendarDay } from '@/shared/lib/dates';

// El formulario de asignar una rutina puntual a un alumno (CU-E-19): `AssignRoutineToUserDto` sin la rutina
// y el alumno, que se eligen aparte. Queda el día en que el alumno hace la rutina: obligatorio, pasado o
// futuro (el servidor no calcula "hoy"). Es un texto `YYYY-MM-DD`: un <input type="date"> entrega eso, o ""
// si está vacío o incompleto. Un día por asignación: para varios días son varias asignaciones.

export const assignRoutineSchema = z.object({
  date: z
    .string()
    .refine(isCalendarDay, 'Elegí el día en que el alumno hace la rutina'),
});

export type AssignRoutineValues = z.infer<typeof assignRoutineSchema>;
