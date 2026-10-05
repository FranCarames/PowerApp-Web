import { useEffect, useState } from 'react';

/**
 * El valor, pero que recién cambia cuando pasaron `delay` ms sin que cambie de nuevo. Sirve para no
 * pedirle al backend en cada tecla de un buscador. El primer valor se devuelve al instante.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
