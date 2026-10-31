/**
 * El CUIL con su máscara: "20301112224" → "20-30111222-4". Se envía y se guarda sin guiones, de 11
 * dígitos; si no los tiene, se muestra tal cual.
 */
export function formatCuil(cuil: string): string {
  const digits = cuil.replace(/\D/g, '');
  return digits.length === 11
    ? `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
    : cuil;
}

/**
 * El CUIL mientras se escribe: solo dígitos, hasta 11, con un guion después del 2.º y del 10.º que
 * aparece recién cuando hay un dígito después ("27", "27-1", "27-12345678", "27-12345678-4"). Así
 * borrar no se trabe en un guion que quedó colgando. Lo pegado, con o sin guiones, queda igual; lo que
 * no es un dígito no entra.
 *
 * `caret` es el cursor del texto sin formato: el que devuelve se queda después del mismo dígito, así
 * que editar en el medio no lo manda al final.
 */
export function maskCuil(
  text: string,
  caret: number = text.length,
): { value: string; caret: number } {
  const digits = text.replace(/\D/g, '').slice(0, 11);
  const value = [digits.slice(0, 2), digits.slice(2, 10), digits.slice(10)]
    .filter(Boolean)
    .join('-');

  const before = Math.min(
    text.slice(0, caret).replace(/\D/g, '').length,
    digits.length,
  );
  // Los guiones que hay antes del dígito `before`; no hay guion sin un dígito después.
  const hyphens = before > 10 ? 2 : before > 2 ? 1 : 0;
  return { value, caret: before + hyphens };
}

/** "$18.000" o "$9.999,99": un monto en pesos argentinos, con hasta dos decimales (como el prototipo). */
export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

/** "80" o "82,5": un número con hasta dos decimales y coma decimal (es-AR). */
export function formatDecimal(value: number): string {
  return value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

/** "80 kg" o "82,5 kg": un peso en kilos, con hasta dos decimales y coma decimal (es-AR). */
export function formatWeight(kg: number): string {
  return `${formatDecimal(kg)} kg`;
}

/** "12 semanas", "1 semana" o "Sin duración fija" (0): la duración de una planificación, que es un número de semanas. */
export function formatWeeks(weeks: number): string {
  if (weeks === 0) return 'Sin duración fija';
  return `${weeks} semana${weeks === 1 ? '' : 's'}`;
}

/** "01:30": segundos como minutos y segundos, con dos dígitos cada uno (el reloj del temporizador). */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
