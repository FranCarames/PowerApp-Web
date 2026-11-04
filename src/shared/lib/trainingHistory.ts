import type {
  RoutineHistoryExercise,
  RoutineHistorySession,
  UserRm,
} from '@/api/types';

import { addDays, mondayOf } from './dates';
import { formatWeight } from './format';

/*
 * Los cálculos del historial de entrenamientos de un alumno (CU-E-06 y CU-E-07), según la spec del
 * 4/11 (PowerApp-Docs: Doc/specs/2026-11-04-historial-de-entrenamientos-design.md, sección 9). Son
 * funciones puras, sin React: reciben las respuestas del backend y «hoy» (un día `YYYY-MM-DD`), así
 * que se pueden revisar con cualquier fecha.
 *
 * Todas las fechas son días de calendario (`YYYY-MM-DD`) y se comparan como texto: en ese formato,
 * el orden alfabético es el cronológico. Nunca pasan por `new Date(día)`, que las lee en UTC (9.1).
 */

/** Un día de calendario, `YYYY-MM-DD`. */
export type Day = string;
/** Un mes, `YYYY-MM`: el del parámetro `?mes` de la URL. */
export type Month = string;

const SHORT_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const LONG_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const LONG_WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const MS_PER_DAY = 86_400_000;

/** El año, el mes (1 a 12) y el día de un día de calendario. Un ISO con hora se corta en el día. */
function partsOf(day: Day) {
  const [year, month, date] = day.slice(0, 10).split('-').map(Number);
  return { year, month, date };
}

/** El día de calendario de un ISO: un RM puede venir con hora (`2026-10-28T12:00:00`). */
export function toDay(iso: string): Day {
  return iso.slice(0, 10);
}

/** Cuántos días hay de `from` a `to` (positivo si `to` es posterior). En UTC, sin cambios de horario. */
function daysBetween(from: Day, to: Day): number {
  const a = partsOf(from);
  const b = partsOf(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.date) -
      Date.UTC(a.year, a.month - 1, a.date)) /
      MS_PER_DAY,
  );
}

/** 0 es domingo y 6 es sábado, como `Date.getDay`, en el día local y no en UTC. */
function weekdayOf(day: Day): number {
  const { year, month, date } = partsOf(day);
  return new Date(year, month - 1, date).getDay();
}

// ── Textos ─────────────────────────────────────────────────────────────

/** «1 sesión» o «3 sesiones» (9.1, singular). */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** «2,3»: coma decimal y un decimal como máximo (9.1). */
export function formatOneDecimal(value: number): string {
  return value.toLocaleString('es-AR', { maximumFractionDigits: 1 });
}

/** Fecha corta (9.1): «4 nov» y, si no es del año de hoy, «28 dic 2025». */
export function formatShortDay(day: Day, today: Day): string {
  const { year, month, date } = partsOf(day);
  const sameYear = year === partsOf(today).year;
  return `${date} ${SHORT_MONTHS[month - 1]}${sameYear ? '' : ` ${year}`}`;
}

/**
 * Fecha relativa (9.1): «Hoy», «Ayer», «Hace N días» (de 2 a 6) y, de 7 en adelante o si es posterior a
 * hoy, la fecha corta.
 */
export function formatRelativeDay(day: Day, today: Day): string {
  const ago = daysBetween(day, today);
  if (ago === 0) return 'Hoy';
  if (ago === 1) return 'Ayer';
  if (ago >= 2 && ago <= 6) return `Hace ${ago} días`;
  return formatShortDay(day, today);
}

/** El rango de una semana (9.1): «19 — 25 oct» o, si cruza de mes, «26 oct — 1 nov». */
export function formatWeekRange(monday: Day, today: Day): string {
  const sunday = addDays(monday, 6);
  const start = partsOf(monday);
  const end = partsOf(sunday);
  const sameMonth = start.month === end.month && start.year === end.year;
  return `${sameMonth ? start.date : formatShortDay(monday, today)} — ${formatShortDay(sunday, today)}`;
}

/** «Semana del 26 oct al 1 nov», para el texto alternativo de las barras (spec 11). */
export function weekLabel(monday: Day, today: Day): string {
  return `Semana del ${formatShortDay(monday, today)} al ${formatShortDay(addDays(monday, 6), today)}`;
}

/** El título de una semana de la lista (6.4): «Esta semana», «Semana pasada» o su rango. */
export function weekTitle(monday: Day, today: Day): string {
  const current = mondayOf(today);
  if (monday === current) return 'Esta semana';
  if (monday === addDays(current, -7)) return 'Semana pasada';
  return formatWeekRange(monday, today);
}

/** «Miércoles 4 de noviembre»: el título del día elegido del calendario (7.3). */
export function formatLongDay(day: Day): string {
  const { month, date } = partsOf(day);
  return `${LONG_WEEKDAYS[weekdayOf(day)]} ${date} de ${LONG_MONTHS[month - 1]}`;
}

/** «4 de noviembre»: el comienzo del texto alternativo de un día del calendario (spec 11). */
export function formatDayAndMonth(day: Day): string {
  const { month, date } = partsOf(day);
  return `${date} de ${LONG_MONTHS[month - 1]}`;
}

/** El día (`4`) y el mes de tres letras (`nov`) de un día: la fecha de una tarjeta o de una barra. */
export function dayParts(day: Day): { date: number; month: string } {
  const { month, date } = partsOf(day);
  return { date, month: SHORT_MONTHS[month - 1] };
}

/** «el 28 oct de 2026»: la fecha de un único RM (8.3), siempre con el año. */
export function formatDayWithYear(day: Day): string {
  const { year, month, date } = partsOf(day);
  return `el ${date} ${SHORT_MONTHS[month - 1]} de ${year}`;
}

/** «noviembre»: el mes en minúscula, para «Sesiones de noviembre» y «Veces en noviembre». */
export function monthName(month: Month): string {
  return LONG_MONTHS[partsOf(`${month}-01`).month - 1];
}

/** «Noviembre 2026»: el título del calendario (7.2). */
export function monthTitle(month: Month): string {
  const name = monthName(month);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${partsOf(`${month}-01`).year}`;
}

// ── Meses ──────────────────────────────────────────────────────────────

/** El mes de un día. */
export function monthOf(day: Day): Month {
  return day.slice(0, 7);
}

/** El mes `months` meses después (o antes, si es negativo). */
export function addMonths(month: Month, months: number): Month {
  const { year, month: number } = partsOf(`${month}-01`);
  const index = year * 12 + (number - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

const MONTH_PARAM = /^\d{4}-(0[1-9]|1[0-2])$/;

/** El día más viejo del historial (9.3): la fecha de una sesión o el día de un ejercicio hecho. */
function oldestDay(sessions: readonly RoutineHistorySession[]): Day | null {
  let oldest: Day | null = null;
  for (const session of sessions) {
    if (oldest === null || session.date < oldest) oldest = session.date;
    for (const exercise of session.exercises) {
      const day = toDay(exercise.finished_at);
      if (day < oldest) oldest = day;
    }
  }
  return oldest;
}

/** Los meses que se pueden ver (9.3): del mes del día más viejo del historial al mes de hoy. */
export interface MonthRange {
  first: Month;
  last: Month;
}

export function monthRange(
  sessions: readonly RoutineHistorySession[],
  today: Day,
): MonthRange {
  const last = monthOf(today);
  const oldest = oldestDay(sessions);
  const first = oldest === null ? last : monthOf(oldest);
  return { first: first < last ? first : last, last };
}

/**
 * El mes del parámetro `?mes` (sección 3): sin él o mal formado, el mes de hoy; fuera del rango, el
 * extremo más cercano.
 */
export function resolveMonth(param: string | null, range: MonthRange): Month {
  if (param === null || !MONTH_PARAM.test(param)) return range.last;
  if (param < range.first) return range.first;
  if (param > range.last) return range.last;
  return param;
}

// ── Semanas ────────────────────────────────────────────────────────────

/** Una semana completa, de lunes a domingo (9.2). */
export interface WeekSlot {
  monday: Day;
  sunday: Day;
  /** La que tiene hoy. */
  current: boolean;
  /** La que empieza después de hoy. */
  future: boolean;
}

function weekSlot(monday: Day, today: Day): WeekSlot {
  const sunday = addDays(monday, 6);
  return {
    monday,
    sunday,
    current: monday <= today && today <= sunday,
    future: monday > today,
  };
}

/** El último día de un mes. */
function lastDayOf(month: Month): Day {
  return addDays(`${addMonths(month, 1)}-01`, -1);
}

/**
 * Las semanas de un mes (9.2): todas las semanas completas con al menos un día del mes, de la que tiene
 * el día 1 a la que tiene el último. Son entre 4 y 6, y una que cruza de mes es la misma en los dos.
 */
export function weeksOfMonth(month: Month, today: Day): WeekSlot[] {
  const last = lastDayOf(month);
  const weeks: WeekSlot[] = [];
  for (
    let monday = mondayOf(`${month}-01`);
    monday <= last;
    monday = addDays(monday, 7)
  ) {
    weeks.push(weekSlot(monday, today));
  }
  return weeks;
}

/** El alto máximo de un gráfico de barras (9.6): el mayor entre el mínimo y el valor más alto. */
export function barScale(values: readonly number[], minimum: number): number {
  return Math.max(minimum, ...values);
}

/** Las sesiones de cada semana, por el lunes de la fecha de la sesión (9.2), en el orden del backend. */
function sessionsByWeek(
  sessions: readonly RoutineHistorySession[],
): Map<Day, RoutineHistorySession[]> {
  const byWeek = new Map<Day, RoutineHistorySession[]>();
  for (const session of sessions) {
    const monday = mondayOf(session.date);
    const list = byWeek.get(monday);
    if (list) list.push(session);
    else byWeek.set(monday, [session]);
  }
  return byWeek;
}

/** Cuántas sesiones del plan y cuántas individuales tiene una semana. */
export interface WeekSessionCount {
  plan: number;
  individual: number;
  total: number;
}

function countSessions(
  sessions: readonly RoutineHistorySession[] = [],
): WeekSessionCount {
  const plan = sessions.filter(({ source }) => source === 'plan').length;
  return { plan, individual: sessions.length - plan, total: sessions.length };
}

/** El lunes de la sesión más nueva y el de la más vieja. */
function sessionWeekBounds(sessions: readonly RoutineHistorySession[]) {
  let newest: Day | null = null;
  let oldest: Day | null = null;
  for (const { date } of sessions) {
    if (newest === null || date > newest) newest = date;
    if (oldest === null || date < oldest) oldest = date;
  }
  return {
    newest: newest === null ? null : mondayOf(newest),
    oldest: oldest === null ? null : mondayOf(oldest),
  };
}

// ── Resumen y gráfico del mes (6.1 y 6.2) ─────────────────────────────

/** El resumen de la pestaña Sesiones (6.1). */
export interface HistorySummary {
  total: number;
  /** La fecha de la sesión más nueva, o `null` sin sesiones. */
  last: Day | null;
  /** Las sesiones con fecha en la semana de hoy. */
  thisWeek: number;
}

export function historySummary(
  sessions: readonly RoutineHistorySession[],
  today: Day,
): HistorySummary {
  const current = mondayOf(today);
  let last: Day | null = null;
  for (const { date } of sessions)
    if (last === null || date > last) last = date;
  return {
    total: sessions.length,
    last,
    thisWeek: sessions.filter(({ date }) => mondayOf(date) === current).length,
  };
}

/** Una barra del gráfico «Sesiones de <mes>». */
export interface SessionBar extends WeekSlot, WeekSessionCount {
  /** Si se puede tocar (6.2): de la semana de la sesión más vieja a la actual. */
  selectable: boolean;
}

export interface MonthSessions {
  bars: SessionBar[];
  /** Las semanas del gráfico que ya empezaron (la M del subtítulo). */
  startedWeeks: number;
  /** Las sesiones de esas semanas (la N del subtítulo). */
  sessions: number;
  /** El valor que llena una barra (9.6). */
  scale: number;
}

/**
 * Las barras de «Sesiones de <mes>» (6.2): una por semana del mes, con todas sus sesiones (también las
 * de los días del otro mes, si cruza). Las futuras no cuentan para el subtítulo ni para la escala.
 */
export function monthSessionBars(
  sessions: readonly RoutineHistorySession[],
  month: Month,
  today: Day,
): MonthSessions {
  const byWeek = sessionsByWeek(sessions);
  const { oldest } = sessionWeekBounds(sessions);
  const current = mondayOf(today);
  const bars = weeksOfMonth(month, today).map((week) => ({
    ...week,
    ...countSessions(byWeek.get(week.monday)),
    selectable:
      !week.future &&
      oldest !== null &&
      week.monday >= oldest &&
      week.monday <= current,
  }));
  const started = bars.filter(({ future }) => !future);
  return {
    bars,
    startedWeeks: started.length,
    sessions: started.reduce((sum, { total }) => sum + total, 0),
    scale: barScale(
      started.map(({ total }) => total),
      4,
    ),
  };
}

/** El mini gráfico de la ficha (spec 4): las 8 semanas que terminan en la actual, de la más vieja a la más nueva. */
export function recentWeeks(
  sessions: readonly RoutineHistorySession[],
  today: Day,
  count = 8,
): { weeks: WeekSessionCount[]; scale: number } {
  const byWeek = sessionsByWeek(sessions);
  const current = mondayOf(today);
  const weeks = Array.from({ length: count }, (_, index) =>
    countSessions(byWeek.get(addDays(current, -7 * (count - 1 - index)))),
  );
  return {
    weeks,
    scale: barScale(
      weeks.map(({ total }) => total),
      4,
    ),
  };
}

// ── La lista por semana (6.4) ──────────────────────────────────────────

/** Una semana de la lista, con sus sesiones en el orden del backend. */
export interface HistoryWeek {
  monday: Day;
  sessions: RoutineHistorySession[];
}

/**
 * Las semanas de la lista (6.4): de la actual hacia atrás hasta la de la sesión más vieja, con las que no
 * tienen sesiones. Si hay sesiones con fecha posterior a esta semana, arranca en la de la más nueva.
 */
export function historyWeeks(
  sessions: readonly RoutineHistorySession[],
  today: Day,
): HistoryWeek[] {
  const { newest, oldest } = sessionWeekBounds(sessions);
  if (newest === null || oldest === null) return [];
  const byWeek = sessionsByWeek(sessions);
  const current = mondayOf(today);
  const weeks: HistoryWeek[] = [];
  for (
    let monday = newest > current ? newest : current;
    monday >= oldest;
    monday = addDays(monday, -7)
  ) {
    weeks.push({ monday, sessions: byWeek.get(monday) ?? [] });
  }
  return weeks;
}

/** Si el ejercicio se hizo otro día que la fecha de la sesión: la tarjeta lo aclara con «Hecho el …». */
export function doneOnAnotherDay(
  exercise: RoutineHistoryExercise,
  sessionDate: Day,
): boolean {
  return toDay(exercise.finished_at) !== sessionDate;
}

/**
 * Un id para cada sesión, que sirve de clave y de `id` en el HTML: la individual tiene el de su
 * asignación y la del plan, el par de la planificación del alumno y la rutina del plan (CU-E-06, «cada
 * rutina del plan es una sesión»).
 */
export function sessionId(session: RoutineHistorySession): string {
  return session.source === 'plan'
    ? `p-${session.user_planification_id}-${session.routine_asignation_id}`
    : `i-${session.assignment_id}`;
}

/** «Fuerza 5×5 · Semana 2» o «Semana 2» si la planificación no tiene nombre; «Rutina puntual» si es individual (6.4). */
export function sessionOrigin(session: RoutineHistorySession): string {
  if (session.source !== 'plan') return 'Rutina puntual';
  return session.planification.name
    ? `${session.planification.name} · Semana ${session.week}`
    : `Semana ${session.week}`;
}

// ── Calendario (7 y 9.4) ───────────────────────────────────────────────

/** Lo que el alumno hizo un día: cuántos ejercicios y en qué sesiones (en el orden de la lista). */
export interface DayActivity {
  exercises: number;
  sessions: RoutineHistorySession[];
}

/** Los ejercicios hechos de cada día, por `finished_at`, sumando todas las sesiones (9.4). */
export function activityByDay(
  sessions: readonly RoutineHistorySession[],
): Map<Day, DayActivity> {
  const byDay = new Map<Day, DayActivity>();
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const day = toDay(exercise.finished_at);
      const activity = byDay.get(day) ?? { exercises: 0, sessions: [] };
      activity.exercises += 1;
      if (!activity.sessions.includes(session)) activity.sessions.push(session);
      byDay.set(day, activity);
    }
  }
  return byDay;
}

/** Los cuatro niveles de intensidad (9.4): 0, 1–2, 3–4 y 5 o más ejercicios. */
export type Intensity = 0 | 1 | 2 | 3;

export function intensityOf(exercises: number): Intensity {
  if (exercises >= 5) return 3;
  if (exercises >= 3) return 2;
  return exercises >= 1 ? 1 : 0;
}

export interface CalendarDay {
  day: Day;
  date: number;
  exercises: number;
  sessions: number;
  level: Intensity;
  today: boolean;
  future: boolean;
}

export interface MonthCalendar {
  /** Los huecos antes del día 1, con la semana de lunes a domingo. */
  leading: number;
  days: CalendarDay[];
  /** Los días del mes con al menos un ejercicio hecho (7.1). */
  trainedDays: number;
  /** Las sesiones con al menos un ejercicio hecho en un día del mes (7.1). */
  sessions: number;
  /** El último día del mes con ejercicios hechos, o `null`. */
  lastTrainedDay: Day | null;
}

export function monthCalendar(
  activity: ReadonlyMap<Day, DayActivity>,
  month: Month,
  today: Day,
): MonthCalendar {
  const first = `${month}-01`;
  const last = lastDayOf(month);
  const sessions = new Set<RoutineHistorySession>();
  const days: CalendarDay[] = [];
  let lastTrainedDay: Day | null = null;

  for (let day = first; day <= last; day = addDays(day, 1)) {
    const done = activity.get(day);
    if (done) {
      lastTrainedDay = day;
      done.sessions.forEach((session) => sessions.add(session));
    }
    days.push({
      day,
      date: partsOf(day).date,
      exercises: done?.exercises ?? 0,
      sessions: done?.sessions.length ?? 0,
      level: intensityOf(done?.exercises ?? 0),
      today: day === today,
      future: day > today,
    });
  }

  return {
    leading: (weekdayOf(first) + 6) % 7,
    days,
    trainedDays: days.filter(({ exercises }) => exercises > 0).length,
    sessions: sessions.size,
    lastTrainedDay,
  };
}

/**
 * El día elegido de entrada (7.3): en el mes actual, hoy; en otro, su último día con ejercicios hechos;
 * si no tiene ninguno, ninguno.
 */
export function defaultCalendarDay(
  month: Month,
  today: Day,
  calendar: MonthCalendar,
): Day | null {
  return month === monthOf(today) ? today : calendar.lastTrainedDay;
}

/**
 * La racha actual (9.5): las semanas completas seguidas con al menos una sesión, contando hacia atrás
 * desde la actual. Si la actual todavía no tiene ninguna, se cuenta desde la anterior.
 */
export function currentStreak(
  sessions: readonly RoutineHistorySession[],
  today: Day,
): number {
  const weeks = new Set(sessions.map(({ date }) => mondayOf(date)));
  let monday = mondayOf(today);
  if (!weeks.has(monday)) monday = addDays(monday, -7);
  let streak = 0;
  while (weeks.has(monday)) {
    streak += 1;
    monday = addDays(monday, -7);
  }
  return streak;
}

// ── Ejercicios (6.3 y 9.7) ─────────────────────────────────────────────

/** Un ejercicio del catálogo que el alumno hizo, con sus veces: las sesiones en las que lo hizo. */
export interface ExerciseTimes {
  id: string;
  name: string;
  times: number;
}

/** Los ejercicios que el alumno hizo, con sus veces (9.7), por orden alfabético. */
export function exerciseTimes(
  sessions: readonly RoutineHistorySession[],
): ExerciseTimes[] {
  const found = new Map<string, ExerciseTimes>();
  for (const session of sessions) {
    const inSession = new Set<string>();
    for (const { exercise } of session.exercises) {
      if (inSession.has(exercise.id)) continue;
      inSession.add(exercise.id);
      const entry = found.get(exercise.id);
      if (entry) entry.times += 1;
      else found.set(exercise.id, { ...exercise, times: 1 });
    }
  }
  return [...found.values()].sort(byName);
}

/** Por nombre, con las reglas del español. */
export function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, 'es');
}

/** Los ejercicios que más hizo (9.7): por veces, de más a menos, y a igual cantidad por nombre. */
export function topExercises(
  exercises: readonly ExerciseTimes[],
  count = 3,
): ExerciseTimes[] {
  return [...exercises]
    .sort((a, b) => b.times - a.times || byName(a, b))
    .slice(0, count);
}

/** Una vez (9.7): una sesión en la que hizo el ejercicio, con cada vez que lo marcó y la fecha. */
export interface ExerciseOccurrence {
  session: RoutineHistorySession;
  /** Cada vez que lo hizo en la sesión, en el orden del backend. */
  entries: RoutineHistoryExercise[];
  /** El día en que lo hizo: el más viejo, si fueron varios. En una individual, no es el `date`. */
  day: Day;
}

/**
 * Las veces de un ejercicio (8.7), de la más nueva a la más vieja por el día en que lo hizo. A igual día,
 * en el orden del backend (`sort` es estable).
 */
export function exerciseOccurrences(
  sessions: readonly RoutineHistorySession[],
  exerciseId: string,
): ExerciseOccurrence[] {
  const occurrences: ExerciseOccurrence[] = [];
  for (const session of sessions) {
    const entries = session.exercises.filter(
      ({ exercise }) => exercise.id === exerciseId,
    );
    if (entries.length === 0) continue;
    const day = entries
      .map(({ finished_at }) => toDay(finished_at))
      .reduce((oldest, current) => (current < oldest ? current : oldest));
    occurrences.push({ session, entries, day });
  }
  return occurrences.sort((a, b) =>
    a.day < b.day ? 1 : a.day > b.day ? -1 : 0,
  );
}

/** Una nota del alumno en el ejercicio (8.6). */
export interface ExerciseNote {
  key: string;
  note: string;
  day: Day;
  routine: string;
}

/** Las notas de un ejercicio (8.6), de la más nueva a la más vieja. */
export function exerciseNotes(
  occurrences: readonly ExerciseOccurrence[],
): ExerciseNote[] {
  return occurrences
    .flatMap(({ session, entries }) =>
      entries.flatMap((entry) =>
        entry.user_note?.trim()
          ? [
              {
                key: `${sessionId(session)}-${entry.routine_exercise_id}`,
                note: entry.user_note,
                day: toDay(entry.finished_at),
                routine: session.routine.name,
              },
            ]
          : [],
      ),
    )
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

/** Una barra de «Veces en <mes>» (8.4). */
export interface TimesBar extends WeekSlot {
  times: number;
}

export interface MonthTimes {
  bars: TimesBar[];
  /** Las veces de las semanas que ya empezaron. */
  times: number;
  scale: number;
}

/** Las veces por semana de un mes (8.4): cada vez cuenta en la semana del día en que lo hizo. */
export function monthTimesBars(
  occurrences: readonly ExerciseOccurrence[],
  month: Month,
  today: Day,
): MonthTimes {
  const bars = weeksOfMonth(month, today).map((week) => ({
    ...week,
    times: occurrences.filter(
      ({ day }) => day >= week.monday && day <= week.sunday,
    ).length,
  }));
  const started = bars.filter(({ future }) => !future);
  return {
    bars,
    times: started.reduce((sum, { times }) => sum + times, 0),
    scale: barScale(
      started.map(({ times }) => times),
      3,
    ),
  };
}

// ── RMs (8.3 y 9.8) ────────────────────────────────────────────────────

/** Un RM del ejercicio. */
export interface RmPoint {
  day: Day;
  weight: number;
  reps: number;
}

/**
 * Los RMs del alumno para un ejercicio (9.8), por fecha. A igual fecha, en el orden en que los devuelve
 * el backend (`sort` es estable). El RM actual es el último.
 */
export function rmProgression(
  rms: readonly UserRm[],
  exerciseId: string,
): RmPoint[] {
  return rms
    .filter((rm) => rm.exercise_id === exerciseId)
    .map((rm) => ({ day: toDay(rm.date), weight: rm.weight, reps: rm.reps }))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

/** «85 kg × 3», o «80 kg» si es de una repetición (8.3). */
export function formatRm({ weight, reps }: RmPoint): string {
  return reps > 1 ? `${formatWeight(weight)} × ${reps}` : formatWeight(weight);
}

/** Un punto del gráfico: `x` e `y` en porcentaje del área (y crece hacia abajo, como en CSS). */
export interface RmChartPoint extends RmPoint {
  x: number;
  y: number;
}

/**
 * Los puntos de «Progresión del RM» (8.3): el eje horizontal es proporcional al tiempo (del 3 % al 97 %)
 * y el vertical va del peso menor al mayor con un 25 % de margen de cada lado (±1 kg si son iguales).
 * `delta` es el peso del último menos el del primero.
 */
export function rmChart(points: readonly RmPoint[]): {
  points: RmChartPoint[];
  delta: number;
} {
  if (points.length === 0) return { points: [], delta: 0 };
  const first = points[0];
  const span = daysBetween(first.day, points[points.length - 1].day);
  const weights = points.map(({ weight }) => weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const pad = (max - min) * 0.25 || 1;
  const low = min - pad;
  const high = max + pad;
  return {
    points: points.map((point, index) => ({
      ...point,
      // Todos el mismo día: se reparten parejos para que no queden encimados.
      x:
        3 +
        (span === 0
          ? points.length === 1
            ? 47
            : (index / (points.length - 1)) * 94
          : (daysBetween(first.day, point.day) / span) * 94),
      y: 100 - ((point.weight - low) / (high - low)) * 100,
    })),
    delta: points[points.length - 1].weight - first.weight,
  };
}
