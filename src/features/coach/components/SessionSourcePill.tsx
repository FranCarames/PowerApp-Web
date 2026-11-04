import type { RoutineHistorySession } from '@/api/types';
import { Pill } from '@/shared/ui';

/** «Plan» (violeta) o «Individual» (naranja): de dónde viene la sesión (CU-E-06). */
export function SessionSourcePill({
  session,
}: {
  session: RoutineHistorySession;
}) {
  return session.source === 'plan' ? (
    <Pill tone="acc">Plan</Pill>
  ) : (
    <Pill tone="pri">Individual</Pill>
  );
}
