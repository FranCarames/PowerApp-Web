// Lo que comparten el editor de rutina, «Agregar circuitos» y la biblioteca de escritorio para mostrar
// los circuitos que ya están en la rutina (CU-E-16 y CU-E-17).

/** Cuántas veces está cada circuito en la rutina: un circuito se puede repetir. */
export function circuitCounts(
  circuits: ReadonlyArray<{ circuit_id: string }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { circuit_id } of circuits) {
    counts.set(circuit_id, (counts.get(circuit_id) ?? 0) + 1);
  }
  return counts;
}

/** La marca de un circuito que ya está en la rutina: «En la rutina» con uno y «En la rutina ×N» desde dos. */
export function inRoutineLabel(count: number): string {
  return count === 1 ? 'En la rutina' : `En la rutina ×${count}`;
}
