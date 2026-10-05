/** "$18.000" o "$9.999,99": un monto en pesos argentinos, con hasta dos decimales (como el prototipo). */
export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}
