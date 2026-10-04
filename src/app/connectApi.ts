import { configureApi } from '@/api/client';
import { readSession } from '@/features/auth/session';

/**
 * Conecta el cliente de la API con la sesión: el token sale de lo que guarda AuthProvider. Se lee
 * del storage en cada request, así que nunca queda desactualizado y está listo antes del primer render.
 */
export function connectApiToSession(): void {
  configureApi({ getToken: () => readSession()?.token ?? null });
}
