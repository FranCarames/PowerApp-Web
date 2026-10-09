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

/** "01:30": segundos como minutos y segundos, con dos dígitos cada uno (el reloj del temporizador). */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
